//go:build windows

package autostart

import (
	"fmt"
	"os"

	"golang.org/x/sys/windows/registry"
)

// EnsureAutostart adds NegcesLab.exe to the Windows Registry CurrentUser Run key
func EnsureAutostart() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	key, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Run`, registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("failed to open registry key: %w", err)
	}
	defer key.Close()

	err = key.SetStringValue("NegcesLabAgent", exePath)
	if err != nil {
		return fmt.Errorf("failed to set registry run value: %w", err)
	}

	return nil
}
