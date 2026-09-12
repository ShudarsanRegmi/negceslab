//go:build windows

package autostart

import (
	"fmt"
	"os"

	"golang.org/x/sys/windows/registry"
)

// EnsureAutostart adds NegcesLab.exe to HKLM (All Users) if admin, else HKCU (Current User)
func EnsureAutostart() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	val := fmt.Sprintf(`"%s"`, exePath)

	// Try HKEY_LOCAL_MACHINE first (Machine-wide for all student user accounts)
	hklmKey, _, err := registry.CreateKey(registry.LOCAL_MACHINE, `Software\Microsoft\Windows\CurrentVersion\Run`, registry.SET_VALUE)
	if err == nil {
		_ = hklmKey.SetStringValue("NegcesLabAgent", val)
		hklmKey.Close()
		return nil
	}

	// Fallback to HKEY_CURRENT_USER if not running with elevated admin rights
	hkcuKey, _, err := registry.CreateKey(registry.CURRENT_USER, `Software\Microsoft\Windows\CurrentVersion\Run`, registry.SET_VALUE)
	if err != nil {
		return fmt.Errorf("failed to open registry run key: %w", err)
	}
	defer hkcuKey.Close()

	return hkcuKey.SetStringValue("NegcesLabAgent", val)
}
