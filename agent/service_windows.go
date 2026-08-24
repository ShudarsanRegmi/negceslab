//go:build windows

package main

import (
	"fmt"
	"os"

	"golang.org/x/sys/windows/svc"
)

const ServiceName = "NegcesLabAgent"

type agentService struct {
	runFunc func()
}

func (s *agentService) Execute(args []string, r <-chan svc.ChangeRequest, changes chan<- svc.Status) (ssec bool, errno uint32) {
	const cmdsAccepted = svc.AcceptStop | svc.AcceptShutdown
	changes <- svc.Status{State: svc.StartPending}
	
	// Start the actual daemon in a goroutine
	go s.runFunc()

	changes <- svc.Status{State: svc.Running, Accepts: cmdsAccepted}
	
	for {
		c := <-r
		switch c.Cmd {
		case svc.Interrogate:
			changes <- c.CurrentStatus
		case svc.Stop, svc.Shutdown:
			changes <- svc.Status{State: svc.StopPending}
			return
		default:
			fmt.Printf("Unexpected control request: %d\n", c.Cmd)
		}
	}
}

func runInService(runFunc func()) {
	isService, err := svc.IsWindowsService()
	if err != nil {
		return
	}
	if isService {
		err = svc.Run(ServiceName, &agentService{runFunc: runFunc})
		if err != nil {
			fmt.Printf("Service execution failed: %v\n", err)
		}
		os.Exit(0)
	}
}
