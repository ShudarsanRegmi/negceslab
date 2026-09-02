//go:build !windows

package sysinfo

import (
	"os/exec"
)

func hideWindow(cmd *exec.Cmd) {
	// No-op on Linux / non-Windows platforms
}
