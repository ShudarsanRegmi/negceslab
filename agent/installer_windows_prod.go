package main

import (
	_ "embed"
	"bufio"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

//go:embed bin/negceslab-agent-windows.exe
var agentBinary []byte

const (
	InstallDir  = `C:\Program Files\NegcesLab-Agent`
	BinaryName  = "negceslab-agent-windows.exe"
	ServiceName = "NegcesLabAgent"
	BackendUrl  = "https://intranet.ch.amrita.edu/negcesapi/"
)

func main() {
	// 1. Require Administrator Permissions / Self-elevate
	if !isAdmin() {
		fmt.Println("Requesting Administrator privileges...")
		runAsAdmin()
		return
	}

	reader := bufio.NewReader(os.Stdin)

	fmt.Println("========================================================")
	fmt.Println("   Negces Lab Agent Production Installer (Windows)     ")
	fmt.Println("========================================================")
	fmt.Printf("Backend API Target: %s\n\n", BackendUrl)

	// 2. Prompt for System ID (Required)
	var systemId string
	for {
		fmt.Print("Enter Target System ID (MongoDB _id from Admin Panel) [REQUIRED]: ")
		systemId, _ = reader.ReadString('\n')
		systemId = strings.TrimSpace(systemId)
		if systemId != "" {
			break
		}
		fmt.Println("Error: System ID is required for production installation.")
		fmt.Println()
	}

	// 3. Prompt for Registration Secret (Required)
	var regSecret string
	for {
		fmt.Print("Enter Server Registration Secret Passcode [REQUIRED]: ")
		regSecret, _ = reader.ReadString('\n')
		regSecret = strings.TrimSpace(regSecret)
		if regSecret != "" {
			break
		}
		fmt.Println("Error: Registration Secret is required.")
		fmt.Println()
	}

	fmt.Println()
	fmt.Printf("[1/4] Creating installation directory at %s...\n", InstallDir)
	if err := os.MkdirAll(InstallDir, 0755); err != nil {
		fmt.Printf("Error creating installation directory: %v\n", err)
		pressEnterToExit(reader)
		return
	}

	// Extract binary
	binaryPath := filepath.Join(InstallDir, BinaryName)
	fmt.Printf("Extracting embedded agent binary to %s...\n", binaryPath)
	
	// Stop service first if it exists to release file lock on binary
	_ = exec.Command("sc.exe", "stop", ServiceName).Run()
	time.Sleep(1 * time.Second)

	if err := ioutil.WriteFile(binaryPath, agentBinary, 0755); err != nil {
		fmt.Printf("Error extracting agent binary (is the service still running?): %v\n", err)
		pressEnterToExit(reader)
		return
	}

	// Generate config with production URL
	fmt.Println("Generating agent_config.json...")
	wsUrl := strings.Replace(BackendUrl, "http", "ws", 1)
	configData := map[string]interface{}{
		"backend_url":               BackendUrl,
		"ws_url":                    wsUrl,
		"poll_interval_sec":         10,
		"offline_sync_interval_sec": 60,
		"retry_attempts":            5,
		"registration_secret":       regSecret,
	}

	configBytes, err := json.MarshalIndent(configData, "", "  ")
	if err != nil {
		fmt.Printf("Error serializing config: %v\n", err)
		pressEnterToExit(reader)
		return
	}

	configPath := filepath.Join(InstallDir, "agent_config.json")
	if err := ioutil.WriteFile(configPath, configBytes, 0644); err != nil {
		fmt.Printf("Error writing config: %v\n", err)
		pressEnterToExit(reader)
		return
	}

	// 3. Register Machine with Backend
	fmt.Println()
	fmt.Println("[2/4] Registering Machine with Backend Server...")
	fmt.Printf("Registering with target system ID: %s...\n", systemId)
	
	registerCmd := exec.Command(binaryPath, "--systemid="+systemId, "--secret="+regSecret)
	registerCmd.Dir = InstallDir
	registerCmd.Stdout = os.Stdout
	registerCmd.Stderr = os.Stderr
	
	if err := registerCmd.Run(); err != nil {
		fmt.Println()
		fmt.Println("======================================================================")
		fmt.Printf(" [FATAL ERROR] Registration Failed: %v\n", err)
		fmt.Println(" Could not fetch system details or authorize with the server.")
		fmt.Println(" The installation has been aborted. Please verify the System ID")
		fmt.Println(" and the Registration Secret, then run this installer again.")
		fmt.Println("======================================================================")
		pressEnterToExit(reader)
		return
	}

	// 4. Register Windows Service (only if registration succeeds!)
	fmt.Println()
	fmt.Println("[3/4] Registering Windows Service Startup Registry...")

	// Remove service if it already exists
	_ = exec.Command("sc.exe", "delete", ServiceName).Run()
	time.Sleep(500 * time.Millisecond)

	// Create service using sc.exe
	binPathArg := fmt.Sprintf(`"%s"`, binaryPath)
	createCmd := exec.Command("sc.exe", "create", ServiceName, "binPath=", binPathArg, "start=", "auto", "DisplayName=", "Negces Lab Agent Telemetry")
	if err := createCmd.Run(); err != nil {
		fmt.Printf("Error registering Windows Service: %v\n", err)
		pressEnterToExit(reader)
		return
	}

	// 5. Start service
	fmt.Println()
	fmt.Println("[4/4] Starting NegcesLab Agent Windows Service...")
	startCmd := exec.Command("sc.exe", "start", ServiceName)
	if err := startCmd.Run(); err != nil {
		fmt.Printf("Error starting Windows Service: %v\n", err)
		pressEnterToExit(reader)
		return
	}

	fmt.Println()
	fmt.Println("========================================================")
	fmt.Println(" [SUCCESS] NegcesLab Agent Installed Successfully!")
	fmt.Println(" Windows Service is running and configured on Startup")
	fmt.Println(" Installation Location: " + InstallDir)
	fmt.Println("========================================================")
	
	pressEnterToExit(reader)
}

func isAdmin() bool {
	shell32 := syscall.NewLazyDLL("shell32.dll")
	isUserAnAdmin := shell32.NewProc("IsUserAnAdmin")
	ret, _, _ := isUserAnAdmin.Call()
	return ret != 0
}

func runAsAdmin() {
	verb := syscall.StringToUTF16Ptr("runas")
	exe, _ := os.Executable()
	cwd, _ := os.Getwd()

	args := strings.Join(os.Args[1:], " ")

	shell32 := syscall.NewLazyDLL("shell32.dll")
	shellExecuteW := shell32.NewProc("ShellExecuteW")

	_, _, err := shellExecuteW.Call(
		0,
		uintptr(unsafe.Pointer(verb)),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(exe))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(args))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(cwd))),
		1, // SW_SHOWNORMAL
	)

	if err != nil && err.Error() != "The operation completed successfully." {
		fmt.Printf("Error launching as admin: %v\n", err)
	}
	os.Exit(0)
}

func pressEnterToExit(reader *bufio.Reader) {
	fmt.Println()
	fmt.Print("Press Enter to exit...")
	_, _ = reader.ReadString('\n')
}
