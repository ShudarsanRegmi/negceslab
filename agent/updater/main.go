//go:build windows

package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"time"
	"unsafe"
)

type Config struct {
	BackendURL string `json:"backend_url"`
}

type VersionInfo struct {
	LatestVersion string `json:"latestVersion"`
	DownloadURL   string `json:"downloadUrl"`
}

func main() {
	// Request admin permissions if needed
	if !isAdmin() {
		runAsAdmin()
		return
	}

	exeDir, _ := filepath.Abs(filepath.Dir(os.Args[0]))
	configPath := filepath.Join(exeDir, "agent_config.json")
	targetBinary := filepath.Join(exeDir, "NegcesLab.exe")

	backendURL := "https://intranet.ch.amrita.edu/negcesapi"
	if cfgData, err := os.ReadFile(configPath); err == nil {
		var cfg Config
		if err := json.Unmarshal(cfgData, &cfg); err == nil && cfg.BackendURL != "" {
			backendURL = cfg.BackendURL
		}
	}

	versionURL := fmt.Sprintf("%s/api/agent/version", backendURL)
	resp, err := http.Get(versionURL)
	
	downloadURL := fmt.Sprintf("%s/downloads/windows/NegcesLab.exe", backendURL)
	if err == nil && resp.StatusCode == http.StatusOK {
		var ver VersionInfo
		if err := json.NewDecoder(resp.Body).Decode(&ver); err == nil && ver.DownloadURL != "" {
			downloadURL = ver.DownloadURL
		}
		resp.Body.Close()
	}

	// 1. Download updated binary to temporary file
	tempBinary := filepath.Join(exeDir, "NegcesLab_new.exe")
	out, err := os.Create(tempBinary)
	if err != nil {
		showMessageBox("Update Error", fmt.Sprintf("Cannot create temporary update file: %v", err), 0x10)
		return
	}

	dlResp, err := http.Get(downloadURL)
	if err != nil {
		out.Close()
		os.Remove(tempBinary)
		showMessageBox("Download Failed", fmt.Sprintf("Failed to download update from %s:\n%v", downloadURL, err), 0x10)
		return
	}
	defer dlResp.Body.Close()

	if dlResp.StatusCode != http.StatusOK {
		out.Close()
		os.Remove(tempBinary)
		showMessageBox("Download Failed", fmt.Sprintf("Server returned status %d when downloading update.", dlResp.StatusCode), 0x10)
		return
	}

	_, err = io.Copy(out, dlResp.Body)
	out.Close()
	if err != nil {
		os.Remove(tempBinary)
		showMessageBox("Download Error", fmt.Sprintf("Failed writing update file: %v", err), 0x10)
		return
	}

	// 2. Kill running NegcesLab.exe process
	_ = exec.Command("taskkill.exe", "/F", "/IM", "NegcesLab.exe").Run()
	time.Sleep(1 * time.Second)

	// 3. Replace target binary
	oldBinary := filepath.Join(exeDir, "NegcesLab.exe.old")
	_ = os.Remove(oldBinary)
	_ = os.Rename(targetBinary, oldBinary)

	if err := os.Rename(tempBinary, targetBinary); err != nil {
		// Rollback if rename fails
		_ = os.Rename(oldBinary, targetBinary)
		showMessageBox("Update Failed", fmt.Sprintf("Failed replacing executable: %v", err), 0x10)
		return
	}

	_ = os.Remove(oldBinary)

	// 4. Relaunch NegcesLab.exe
	cmd := exec.Command(targetBinary)
	cmd.Dir = exeDir
	_ = cmd.Start()

	showMessageBox("NegcesLab Update Successful", "NegcesLab Agent has been successfully updated to the latest version and restarted!", 0x40)
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
