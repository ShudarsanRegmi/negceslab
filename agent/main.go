package main

import (
	"flag"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"negceslab-agent/client"
	"negceslab-agent/config"
	"negceslab-agent/scheduler"
	"negceslab-agent/storage"
	"negceslab-agent/sysinfo"
	"negceslab-agent/ui"
)

func main() {
	// Parse CLI parameters
	registerFlag := flag.Bool("register", false, "Register the machine with the backend")
	attendanceFlag := flag.Bool("attendance", false, "Prompt user for attendance (GUI)")
	cliFlag := flag.Bool("cli", false, "Use CLI prompt instead of web browser GUI")
	checkoutFlag := flag.Bool("checkout", false, "Perform checkout and release machine")
	daemonFlag := flag.Bool("daemon", false, "Start background telemetry monitoring service")
	flag.Parse()
	_ = daemonFlag

	// 1. Initialize configuration and storage
	cfg, err := config.LoadConfig()
	if err != nil {
		fmt.Printf("Warning: Failed to load config, using defaults: %v\n", err)
	}

	store, err := storage.NewStorage()
	if err != nil {
		fmt.Printf("Critical: Failed to initialize local storage: %v\n", err)
		os.Exit(1)
	}

	agentClient := client.NewClient(cfg, store)

	// 2. Process immediate CLI commands
	if *registerFlag {
		registerMachine(cfg, agentClient)
		return
	}

	if *checkoutFlag {
		fmt.Println("Executing manual checkout...")
		err := agentClient.AttendanceCheckInOut("", "", "", "", false)
		if err != nil {
			fmt.Printf("Checkout failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("Checkout successful! Machine released.")
		return
	}

	if *attendanceFlag {
		promptAttendance(agentClient, store, *cliFlag)
		return
	}

	// 3. Default daemon mode
	// Ensure machine is registered
	creds := store.GetCredentials()
	if creds.AuthToken == "" {
		fmt.Println("Machine is not registered. Running auto-registration...")
		registerMachine(cfg, agentClient)
	}

	// Double check registration status
	creds = store.GetCredentials()
	if creds.AuthToken == "" {
		fmt.Println("Critical: Auto-registration failed. Aborting background service.")
		os.Exit(1)
	}

	fmt.Println("Starting NegcesLab Agent background service...")
	
	// Start scheduler to gather metrics and nag attendance
	agentScheduler := scheduler.NewScheduler(agentClient, store)
	telemetryChan := agentScheduler.Start()

	// Start WebSocket connection to stream metrics
	ctxDone := make(chan struct{})
	agentClient.StartWSMetricsStream(ctxDone, telemetryChan)

	// Keep daemon running until OS signal is received
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	fmt.Println("Agent daemon is active. Press Ctrl+C to stop.")
	sig := <-sigChan
	fmt.Printf("Received signal: %v. Initiating graceful shutdown...\n", sig)

	// Perform auto-checkout on daemon shutdown to release machine slot (if desired)
	attendance := store.GetAttendance()
	if attendance.CheckedIn {
		fmt.Println("Cleaning active session. Checking out user...")
		_ = agentClient.AttendanceCheckInOut("", "", "", "", false)
	}

	// Clean up scheduler and WebSocket link
	agentScheduler.Stop()
	close(ctxDone)
	
	// Brief wait to ensure cleanup completes
	time.Sleep(500 * time.Millisecond)
	fmt.Println("NegcesLab Agent cleanly terminated.")
}

func registerMachine(cfg *config.Config, c *client.Client) {
	fmt.Println("Gathering static system inventory details...")
	static, err := sysinfo.CollectStaticInfo()
	if err != nil {
		fmt.Printf("Failed to gather system inventory: %v\n", err)
		os.Exit(1)
	}

	// Apply hostname override if specified in configuration (perfect for system slot mapping tests)
	if cfg.MachineName != "" {
		fmt.Printf("[INFO] Overriding local hostname '%s' with configured machine name '%s'\n", static.Hostname, cfg.MachineName)
		static.Hostname = cfg.MachineName
	}

	fmt.Printf("System specs compiled: \n - Hostname: %s\n - OS: %s\n - CPU: %s\n - RAM: %d GB\n - GPU: %s\n",
		static.Hostname, static.OSVersion, static.CPUModel, static.TotalRAM/(1024*1024*1024), static.GPUModel)

	fmt.Println("Sending registration request to backend...")
	err = c.RegisterMachine(static)
	if err != nil {
		fmt.Printf("Registration failed: %v\n", err)
		os.Exit(1)
	}
	fmt.Println("Auto-registration complete! Cached credentials.")
}

func promptAttendance(c *client.Client, s *storage.Storage, useCli bool) {
	if useCli {
		srv := ui.NewAttendanceServer(c, s)
		srv.StartCLIPrompt()
	} else {
		srv := ui.NewAttendanceServer(c, s)
		srv.StartGUIPortal()
	}
}
