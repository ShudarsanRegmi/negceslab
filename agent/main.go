package main

import (
	"bufio"
	"flag"
	"fmt"
	"os"
	"os/signal"
	"strings"
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
	systemIDFlag := flag.String("systemid", "", "Assign this machine to a specific systemId during registration")
	secretFlag := flag.String("secret", "", "Provide the server registration secret passcode")
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

	if *secretFlag != "" {
		cfg.RegistrationSecret = *secretFlag
	}

	store, err := storage.NewStorage()
	if err != nil {
		fmt.Printf("Critical: Failed to initialize local storage: %v\n", err)
		os.Exit(1)
	}

	agentClient := client.NewClient(cfg, store)

	// 2. Process immediate CLI commands
	if *registerFlag || *systemIDFlag != "" {
		registerMachine(cfg, agentClient, store, *systemIDFlag)
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

	if *attendanceFlag || (!*daemonFlag && !*registerFlag && *systemIDFlag == "" && !*checkoutFlag) {
		promptAttendance(agentClient, store, *cliFlag)
		return
	}

	// 3. Daemon mode (Only when run with --daemon as background service)
	creds := store.GetCredentials()
	if creds.AuthToken == "" {
		fmt.Println("Warning: Background service started on unregistered machine. Retrying credentials...")
	}

	fmt.Println("Starting NegcesLab Agent background service...")
	
	// Start scheduler to gather metrics and nag attendance
	agentScheduler := scheduler.NewScheduler(agentClient, store)
	telemetryChan := agentScheduler.Start()

	// Start WebSocket connection to stream metrics
	ctxDone := make(chan struct{})
	agentClient.StartWSMetricsStream(ctxDone, telemetryChan)

	// If running as a Windows Service, hand over control to Service Control Manager
	runInService(func() {
		// Keep running while service is active
		select {}
	})

	// Keep daemon running until OS signal is received (CLI mode)
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

func registerMachine(cfg *config.Config, c *client.Client, s *storage.Storage, targetSystemID string) {
	creds := s.GetCredentials()
	if creds.AuthToken != "" {
		fmt.Printf("\n[NOTICE] This machine is ALREADY registered with System ID: '%s'\n", creds.MachineID)
		fmt.Print("Do you want to re-register this machine? [y/N]: ")
		reader := bufio.NewReader(os.Stdin)
		ans, _ := reader.ReadString('\n')
		ans = strings.TrimSpace(strings.ToLower(ans))
		if ans != "y" && ans != "yes" {
			fmt.Println("Registration skipped. Continuing with existing machine credentials...")
			return
		}
	}

	if cfg.RegistrationSecret == "" {
		fmt.Print("Enter Registration Secret / Token (from Admin Panel): ")
		reader := bufio.NewReader(os.Stdin)
		sec, _ := reader.ReadString('\n')
		cfg.RegistrationSecret = strings.TrimSpace(sec)
	}

	fmt.Println("Gathering static system inventory details...")
	static, err := sysinfo.CollectStaticInfo()
	if err != nil {
		fmt.Printf("Failed to gather system inventory: %v\n", err)
		os.Exit(1)
	}

	if targetSystemID != "" {
		static.SystemID = targetSystemID
		fmt.Printf("[INFO] Registering directly for Target System ID: %s\n", targetSystemID)
	} else {
		// Fetch available systems from server
		fmt.Println("Fetching list of pre-configured computers from server...")
		systems, err := c.FetchAvailableSystems()
		if err != nil {
			fmt.Printf("Failed to retrieve systems list from server: %v\n", err)
			os.Exit(1)
		}

		if len(systems) == 0 {
			fmt.Println("Error: No pre-configured computers found in database. Please add computers via Admin Panel first.")
			os.Exit(1)
		}

		fmt.Println("\nAvailable Systems in Negces Lab:")
		for i, sys := range systems {
			fmt.Printf("[%d] %s (ID: %s)\n", i+1, sys.Name, sys.ID)
		}
		fmt.Printf("Select target system for this machine (1-%d): ", len(systems))

		var choice int
		_, err = fmt.Scanf("%d\n", &choice)
		if err != nil || choice < 1 || choice > len(systems) {
			fmt.Println("Invalid selection. Aborting registration.")
			os.Exit(1)
		}

		selectedSys := systems[choice-1]
		static.SystemID = selectedSys.ID
		static.Hostname = selectedSys.Name
		fmt.Printf("[INFO] Mapping agent to system: %s (ID: %s)\n", selectedSys.Name, selectedSys.ID)
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
		ui.ShowUnifiedNegcesLabApp(c, s)
	}
}
