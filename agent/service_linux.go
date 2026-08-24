//go:build !windows

package main

func runInService(runFunc func()) {
	// No-op on non-Windows platforms
}
