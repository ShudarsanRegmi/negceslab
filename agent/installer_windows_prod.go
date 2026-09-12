//go:build windows_installer

package main

import (
	_ "embed"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"
)

//go:embed bin/prod/windows/NegcesLab.exe
var agentBinary []byte

//go:embed bin/prod/windows/updater.exe
var updaterBinary []byte

const (
	InstallDir = `C:\Program Files\NegcesLab-Agent`
	BinaryName = "NegcesLab.exe"
	BackendUrl = "https://intranet.ch.amrita.edu/negcesapi"
)

func main() {
	// 1. Require Administrator Permissions / Self-elevate
	if !isAdmin() {
		runAsAdmin()
		return
	}

	// 2. Create Installation Directory
	if err := os.MkdirAll(InstallDir, 0755); err != nil {
		showMessageBox("Installation Error", fmt.Sprintf("Error creating installation directory: %v", err), 0x10)
		return
	}

	// 3. Extract Embedded Agent Binary & Updater Binary
	binaryPath := filepath.Join(InstallDir, BinaryName)
	_ = exec.Command("taskkill.exe", "/F", "/IM", BinaryName).Run()

	if err := ioutil.WriteFile(binaryPath, agentBinary, 0755); err != nil {
		showMessageBox("Extraction Error", fmt.Sprintf("Error extracting NegcesLab.exe: %v", err), 0x10)
		return
	}

	updaterPath := filepath.Join(InstallDir, "updater.exe")
	if len(updaterBinary) > 0 {
		_ = ioutil.WriteFile(updaterPath, updaterBinary, 0755)
	}

	// 4. Generate Default Configuration
	wsUrl := strings.Replace(BackendUrl, "http", "ws", 1)
	configData := map[string]interface{}{
		"backend_url":               BackendUrl,
		"ws_url":                    wsUrl,
		"poll_interval_sec":         10,
		"offline_sync_interval_sec": 60,
		"retry_attempts":            5,
	}

	configBytes, _ := json.MarshalIndent(configData, "", "  ")
	configPath := filepath.Join(InstallDir, "agent_config.json")
	_ = ioutil.WriteFile(configPath, configBytes, 0644)

	// 5. Configure Machine-Wide HKLM Autostart & Task Scheduler for All Student User Accounts
	regCmd := exec.Command("reg.exe", "add", `HKLM\Software\Microsoft\Windows\CurrentVersion\Run`, "/v", "NegcesLabAgent", "/t", "REG_SZ", "/d", fmt.Sprintf(`"%s"`, binaryPath), "/f")
	_ = regCmd.Run()

	taskCmd := exec.Command("schtasks.exe", "/Create", "/TN", "NegcesLabAgent", "/TR", fmt.Sprintf(`"%s"`, binaryPath), "/SC", "ONLOGON", "/RU", "Authenticated Users", "/RL", "HIGHEST", "/F")
	_ = taskCmd.Run()

	// 6. Launch NegcesLab Agent Interactive Application
	launchCmd := exec.Command(binaryPath)
	launchCmd.Dir = InstallDir
	_ = launchCmd.Start()

	showMessageBox("NegcesLab Setup", "NegcesLab Agent installed successfully!\n\nAutostart is configured for ALL USER ACCOUNTS on this computer.", 0x40)
}

func showMessageBox(title, msg string, style uintptr) {
	user32 := syscall.NewLazyDLL("user32.dll")
	messageBoxW := user32.NewProc("MessageBoxW")
	messageBoxW.Call(
		0,
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(msg))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(title))),
		style,
	)
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

	shell32 := syscall.NewLazyDLL("shell32.dll")
	shellExecuteW := shell32.NewProc("ShellExecuteW")

	shellExecuteW.Call(
		0,
		uintptr(unsafe.Pointer(verb)),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(exe))),
		0,
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(cwd))),
		1,
	)
	os.Exit(0)
}
