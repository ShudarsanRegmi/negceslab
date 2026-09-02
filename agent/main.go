package main

import (
	"flag"
	"fmt"
	"os"

	"negceslab-agent/autostart"
	"negceslab-agent/client"
	"negceslab-agent/config"
	"negceslab-agent/scheduler"
	"negceslab-agent/storage"
	"negceslab-agent/ui"
)

func main() {
	// Parse CLI parameters
	registerFlag := flag.Bool("register", false, "Register the machine with the backend")
	systemIDFlag := flag.String("systemid", "", "Assign this machine to a specific systemId during registration")
	secretFlag := flag.String("secret", "", "Provide the server registration secret passcode")
	attendanceFlag := flag.Bool("attendance", false, "Prompt user for attendance (GUI)")
	cliFlag := flag.Bool("cli", false, "Use CLI prompt instead of web browser GUI")
	checkoutFlag := flag.Bool("checkout", false, "Perform checkout and release machine")
	daemonFlag := flag.Bool("daemon", false, "Start background telemetry monitoring service")
	flag.Parse()
	_ = registerFlag
	_ = systemIDFlag
	_ = attendanceFlag
	_ = cliFlag
	_ = daemonFlag

	// 1. Initialize configuration and storage
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Warning: Failed to load config, using defaults: %v\n", err)
	}

	if *secretFlag != "" {
		cfg.RegistrationSecret = *secretFlag
	}

	store, err := storage.NewStorage()
	if err != nil {
		fmt.Printf("Critical: Failed to initialize local storage: %v\n", err)
		os.Exit(1)
	}

	agentClient := client.NewClient(cfg, store)

	// Ensure app self-registers for autostart on boot (Windows Registry / Linux .desktop)
	_ = autostart.EnsureAutostart()

	// 2. Start background telemetry scheduler & WebSocket stream goroutines automatically
	agentScheduler := scheduler.NewScheduler(agentClient, store)
	telemetryChan := agentScheduler.Start()

	ctxDone := make(chan struct{})
	go agentClient.StartWSMetricsStream(ctxDone, telemetryChan)

	// 3. Process CLI checkout flag
	if *checkoutFlag {
		_ = agentClient.AttendanceCheckInOut("", "", "", "", false)
		return
	}

	// 4. Launch Unified Tabbed Native GUI Application (Main App Window)
	ui.RunUnifiedGUIApp(agentClient, store)
}
