package sysinfo

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"time"

	"github.com/shirou/gopsutil/v3/cpu"
	"github.com/shirou/gopsutil/v3/disk"
	"github.com/shirou/gopsutil/v3/host"
	"github.com/shirou/gopsutil/v3/mem"
	"github.com/shirou/gopsutil/v3/net"
)

type StaticInfo struct {
	Hostname     string `json:"hostname"`
	OS           string `json:"os"`
	OSVersion    string `json:"os_version"`
	CPUModel     string `json:"cpu_model"`
	TotalRAM     uint64 `json:"total_ram"`     // in Bytes
	TotalStorage uint64 `json:"total_storage"` // in Bytes
	GPUModel     string `json:"gpu_model"`
}

type DynamicMetrics struct {
	CPUUtil       float64 `json:"cpu_util"`       // %
	RAMUtil       float64 `json:"ram_util"`       // %
	RAMUsed       uint64  `json:"ram_used"`       // Bytes
	GPUUtil       float64 `json:"gpu_util"`       // %
	GPUMemUsed    uint64  `json:"gpu_mem_used"`   // Bytes
	GPUMemTotal   uint64  `json:"gpu_mem_total"`  // Bytes
	NetSentSpeed  float64 `json:"net_sent_speed"` // Bytes/sec
	NetRecvSpeed  float64 `json:"net_recv_speed"` // Bytes/sec
	DiskUtil      float64 `json:"disk_util"`      // %
	CPUTemp       float64 `json:"cpu_temp"`       // °C
	GPUTemp       float64 `json:"gpu_temp"`       // °C
}

// Track previous network metrics to compute speed
var prevNetTime time.Time
var prevNetSent uint64
var prevNetRecv uint64

func CollectStaticInfo() (*StaticInfo, error) {
	info := &StaticInfo{
		OS: runtime.GOOS,
	}

	// 1. Hostname & OS Version
	hInfo, err := host.Info()
	if err == nil {
		info.Hostname = hInfo.Hostname
		info.OSVersion = fmt.Sprintf("%s %s", hInfo.Platform, hInfo.PlatformVersion)
	} else {
		info.Hostname, _ = os.Hostname()
		info.OSVersion = runtime.GOOS
	}

	// 2. CPU Model
	cpuInfo, err := cpu.Info()
	if err == nil && len(cpuInfo) > 0 {
		info.CPUModel = cpuInfo[0].ModelName
	} else {
		info.CPUModel = "Unknown CPU"
	}

	// 3. RAM size
	vMem, err := mem.VirtualMemory()
	if err == nil {
		info.TotalRAM = vMem.Total
	}

	// 4. Total Storage (Root / C:)
	rootPath := "/"
	if runtime.GOOS == "windows" {
		rootPath = "C:\\"
	}
	dUsage, err := disk.Usage(rootPath)
	if err == nil {
		info.TotalStorage = dUsage.Total
	}

	// 5. GPU Model
	info.GPUModel = queryGPUModel()

	return info, nil
}

func CollectDynamicMetrics() (*DynamicMetrics, error) {
	metrics := &DynamicMetrics{}

	// 1. CPU Utilization
	cpuPercs, err := cpu.Percent(0, false)
	if err == nil && len(cpuPercs) > 0 {
		metrics.CPUUtil = cpuPercs[0]
	}

	// 2. Memory Utilization
	vMem, err := mem.VirtualMemory()
	if err == nil {
		metrics.RAMUtil = vMem.UsedPercent
		metrics.RAMUsed = vMem.Used
	}

	// 3. Network Speeds
	now := time.Now()
	netIO, err := net.IOCounters(false)
	if err == nil && len(netIO) > 0 {
		totalSent := netIO[0].BytesSent
		totalRecv := netIO[0].BytesRecv

		if !prevNetTime.IsZero() {
			duration := now.Sub(prevNetTime).Seconds()
			if duration > 0 {
				metrics.NetSentSpeed = float64(totalSent-prevNetSent) / duration
				metrics.NetRecvSpeed = float64(totalRecv-prevNetRecv) / duration
			}
		}
		prevNetTime = now
		prevNetSent = totalSent
		prevNetRecv = totalRecv
	}

	// 4. Disk Usage
	rootPath := "/"
	if runtime.GOOS == "windows" {
		rootPath = "C:\\"
	}
	dUsage, err := disk.Usage(rootPath)
	if err == nil {
		metrics.DiskUtil = dUsage.UsedPercent
	}

	// 5. Temperatures
	metrics.CPUTemp = readCPUTemperature()

	// 6. GPU Metrics
	gpuUtil, gpuMemUsed, gpuMemTotal, gpuTemp := queryGPUMetrics()
	metrics.GPUUtil = gpuUtil
	metrics.GPUMemUsed = gpuMemUsed
	metrics.GPUMemTotal = gpuMemTotal
	metrics.GPUTemp = gpuTemp

	return metrics, nil
}

// Helper to query GPU name using nvidia-smi
func queryGPUModel() string {
	cmdName := "nvidia-smi"
	if runtime.GOOS == "windows" {
		cmdName = `C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe`
	}
	
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, cmdName, "--query-gpu=name", "--format=csv,noheader")
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		// Fallback to checking normal nvidia-smi in PATH on Windows
		if runtime.GOOS == "windows" {
			cmd = exec.CommandContext(ctx, "nvidia-smi", "--query-gpu=name", "--format=csv,noheader")
			out.Reset()
			cmd.Stdout = &out
			if cmd.Run() == nil {
				return strings.TrimSpace(out.String())
			}
		}
		return "None / CPU Integrated"
	}
	return strings.TrimSpace(out.String())
}

// Helper to query live GPU Metrics
func queryGPUMetrics() (util float64, memUsed uint64, memTotal uint64, temp float64) {
	cmdName := "nvidia-smi"
	if runtime.GOOS == "windows" {
		cmdName = `C:\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe`
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, cmdName, "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu", "--format=csv,noheader,nounits")
	var out bytes.Buffer
	cmd.Stdout = &out
	err := cmd.Run()
	if err != nil {
		if runtime.GOOS == "windows" {
			cmd = exec.CommandContext(ctx, "nvidia-smi", "--query-gpu=utilization.gpu,memory.used,memory.total,temperature.gpu", "--format=csv,noheader,nounits")
			out.Reset()
			cmd.Stdout = &out
			if cmd.Run() != nil {
				return 0, 0, 0, 0
			}
		} else {
			return 0, 0, 0, 0
		}
	}

	parts := strings.Split(strings.TrimSpace(out.String()), ",")
	if len(parts) >= 4 {
		u, _ := strconv.ParseFloat(strings.TrimSpace(parts[0]), 64)
		mu, _ := strconv.ParseUint(strings.TrimSpace(parts[1]), 10, 64)
		mt, _ := strconv.ParseUint(strings.TrimSpace(parts[2]), 10, 64)
		t, _ := strconv.ParseFloat(strings.TrimSpace(parts[3]), 64)
		
		// Convert MB to Bytes for uniform metric reporting
		return u, mu * 1024 * 1024, mt * 1024 * 1024, t
	}

	return 0, 0, 0, 0
}

// Read CPU temperature on Windows/Linux
func readCPUTemperature() float64 {
	if runtime.GOOS == "linux" {
		// Read Linux sys thermal zone
		for i := 0; i < 5; i++ {
			path := fmt.Sprintf("/sys/class/thermal/thermal_zone%d/temp", i)
			data, err := os.ReadFile(path)
			if err == nil {
				tempStr := strings.TrimSpace(string(data))
				t, err := strconv.ParseFloat(tempStr, 64)
				if err == nil {
					return t / 1000.0 // sysfs values are in millidegrees Celsius
				}
			}
		}
	} else if runtime.GOOS == "windows" {
		// Call PowerShell WMI queries for CPU temp (requires admin)
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
		defer cancel()
		cmd := exec.CommandContext(ctx, "powershell", "-Command", "Get-WmiObject -Namespace root/WMI -Class MSAcpi_ThermalZoneTemperature | Select-Object -ExpandProperty CurrentTemperature")
		var out bytes.Buffer
		cmd.Stdout = &out
		if cmd.Run() == nil {
			valStr := strings.TrimSpace(out.String())
			t, err := strconv.ParseFloat(valStr, 64)
			if err == nil {
				// MSAcpi_ThermalZoneTemperature reports in Kelvin * 10
				return (t / 10.0) - 273.15
			}
		}
	}
	return 0.0 // Default fallback if unsupported or missing permissions
}
