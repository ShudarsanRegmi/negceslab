//go:build !windows

package autostart

import (
	"fmt"
	"os"
	"path/filepath"
)

// EnsureAutostart creates a .desktop file in ~/.config/autostart/ on Linux
func EnsureAutostart() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}

	homeDir, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	autostartDir := filepath.Join(homeDir, ".config", "autostart")
	if err := os.MkdirAll(autostartDir, 0755); err != nil {
		return err
	}

	desktopFile := filepath.Join(autostartDir, "negceslab.desktop")
	content := fmt.Sprintf(`[Desktop Entry]
Type=Application
Name=NegcesLab Agent
Exec=%s
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
`, exePath)

	return os.WriteFile(desktopFile, []byte(content), 0644)
}
