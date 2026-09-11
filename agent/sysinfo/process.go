package sysinfo

import (
	"sort"
	"strings"

	"github.com/shirou/gopsutil/v3/process"
)

type ProcessInfo struct {
	PID          int32   `json:"pid"`
	Name         string  `json:"name"`
	Username     string  `json:"username"`
	CPUUtil      float64 `json:"cpu_util"`       // %
	RAMUtil      float64 `json:"ram_util"`       // %
	RAMUsedBytes uint64  `json:"ram_used_bytes"` // RSS Bytes
	Cmdline      string  `json:"cmdline"`        // Max 120 chars
}

// CollectTopProcesses collects and returns the top N processes sorted by CPU and RAM usage
func CollectTopProcesses(limit int) ([]ProcessInfo, error) {
	procs, err := process.Processes()
	if err != nil {
		return nil, err
	}

	var processList []ProcessInfo

	for _, p := range procs {
		name, err := p.Name()
		if err != nil || name == "" {
			continue
		}

		cpuPerc, _ := p.CPUPercent()
		memPerc, _ := p.MemoryPercent()
		memInfo, _ := p.MemoryInfo()
		user, _ := p.Username()
		cmdline, _ := p.Cmdline()

		var rss uint64
		if memInfo != nil {
			rss = memInfo.RSS
		}

		// Sanitize user domain (e.g. domain\user -> user)
		if idx := strings.Index(user, "\\"); idx != -1 {
			user = user[idx+1:]
		}

		// Truncate long cmdline strings
		if len(cmdline) > 120 {
			cmdline = cmdline[:117] + "..."
		}

		processList = append(processList, ProcessInfo{
			PID:          p.Pid,
			Name:         name,
			Username:     user,
			CPUUtil:      cpuPerc,
			RAMUtil:      float64(memPerc),
			RAMUsedBytes: rss,
			Cmdline:      cmdline,
		})
	}

	// Sort highest CPU usage first, secondary by RAM
	sort.Slice(processList, func(i, j int) bool {
		if processList[i].CPUUtil == processList[j].CPUUtil {
			return processList[i].RAMUtil > processList[j].RAMUtil
		}
		return processList[i].CPUUtil > processList[j].CPUUtil
	})

	if len(processList) > limit {
		processList = processList[:limit]
	}

	return processList, nil
}
