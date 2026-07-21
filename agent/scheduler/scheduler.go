package scheduler

import (
	"context"
	"fmt"
	"time"

	"negceslab-agent/client"
	"negceslab-agent/storage"
	"negceslab-agent/sysinfo"
	"negceslab-agent/ui"
)

type Scheduler struct {
	cfgChan    chan *sysinfo.DynamicMetrics
	client     *client.Client
	store      *storage.Storage
	ctx        context.Context
	cancel     context.CancelFunc
}

func NewScheduler(c *client.Client, s *storage.Storage) *Scheduler {
	ctx, cancel := context.WithCancel(context.Background())
	return &Scheduler{
		cfgChan: make(chan *sysinfo.DynamicMetrics, 10),
		client:  c,
		store:   s,
		ctx:     ctx,
		cancel:  cancel,
	}
}

func (s *Scheduler) Start() <-chan *sysinfo.DynamicMetrics {
	// Start metrics collecting loop
	go s.metricsLoop()

	// Start attendance nagging loop
	go s.attendanceNaggingLoop()

	return s.cfgChan
}

func (s *Scheduler) Stop() {
	s.cancel()
	close(s.cfgChan)
}

func (s *Scheduler) metricsLoop() {
	// High-frequency collection (10s)
	highFreqTicker := time.NewTicker(10 * time.Second)
	defer highFreqTicker.Stop()

	// Initial collect
	s.collectAndPush()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-highFreqTicker.C:
			s.collectAndPush()
		}
	}
}

func (s *Scheduler) collectAndPush() {
	metrics, err := sysinfo.CollectDynamicMetrics()
	if err != nil {
		fmt.Printf("Error collecting dynamic metrics: %v\n", err)
		return
	}

	select {
	case s.cfgChan <- metrics:
	default:
		// Channel full, drop or ignore (WS stream will catch up next tick)
	}
}

func (s *Scheduler) attendanceNaggingLoop() {
	// Check attendance status every 1 hour (nag user if not checked in)
	nagTicker := time.NewTicker(1 * time.Hour)
	defer nagTicker.Stop()

	// Nag on startup too if user has not checked in
	s.nagIfNeeded()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-nagTicker.C:
			s.nagIfNeeded()
		}
	}
}

func (s *Scheduler) nagIfNeeded() {
	attendance := s.store.GetAttendance()
	if !attendance.CheckedIn {
		fmt.Println("[WARNING] User has not marked check-in attendance. Launching browser portal...")
		
		// Spawn GUI in a new thread so we don't block scheduler operations
		go func() {
			srv := ui.NewAttendanceServer(s.client, s.store)
			srv.StartGUIPortal()
		}()
	}
}
