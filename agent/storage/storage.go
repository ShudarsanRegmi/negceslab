package storage

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type MachineCredentials struct {
	MachineID string `json:"machine_id"`
	AuthToken string `json:"auth_token"`
}

type AttendanceState struct {
	StudentName string    `json:"student_name"`
	StudentEmail string   `json:"student_email"`
	Agenda      string    `json:"agenda"`
	SessionType string    `json:"session_type"`
	CheckInTime time.Time `json:"check_in_time"`
	CheckedIn   bool      `json:"checked_in"`
}

type MetricRecord struct {
	Timestamp time.Time              `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

type AgentDB struct {
	Credentials     MachineCredentials `json:"credentials"`
	Attendance      AttendanceState    `json:"attendance"`
	OfflineMetrics  []MetricRecord     `json:"offline_metrics"`
}

type Storage struct {
	filePath string
	mu       sync.RWMutex
	db       AgentDB
}

func NewStorage() (*Storage, error) {
	exePath, err := os.Executable()
	var dbPath string
	if err != nil {
		dbPath = "agent_db.json"
	} else {
		dbPath = filepath.Join(filepath.Dir(exePath), "agent_db.json")
	}

	s := &Storage{
		filePath: dbPath,
	}

	if err := s.load(); err != nil {
		return nil, err
	}

	return s, nil
}

func (s *Storage) load() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if _, err := os.Stat(s.filePath); os.IsNotExist(err) {
		s.db = AgentDB{
			OfflineMetrics: []MetricRecord{},
		}
		return s.saveUnlocked()
	}

	data, err := ioutil.ReadFile(s.filePath)
	if err != nil {
		return err
	}

	if err := json.Unmarshal(data, &s.db); err != nil {
		// If unmarshal fails (file corrupt), reset
		s.db = AgentDB{
			OfflineMetrics: []MetricRecord{},
		}
		return s.saveUnlocked()
	}

	if s.db.OfflineMetrics == nil {
		s.db.OfflineMetrics = []MetricRecord{}
	}

	return nil
}

func (s *Storage) saveUnlocked() error {
	data, err := json.MarshalIndent(&s.db, "", "  ")
	if err != nil {
		return err
	}
	return ioutil.WriteFile(s.filePath, data, 0600)
}

func (s *Storage) SaveCredentials(creds MachineCredentials) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.db.Credentials = creds
	return s.saveUnlocked()
}

func (s *Storage) GetCredentials() MachineCredentials {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.db.Credentials
}

func (s *Storage) SaveAttendance(state AttendanceState) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.db.Attendance = state
	return s.saveUnlocked()
}

func (s *Storage) GetAttendance() AttendanceState {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.db.Attendance
}

func (s *Storage) QueueMetric(data map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	record := MetricRecord{
		Timestamp: time.Now(),
		Data:      data,
	}
	
	s.db.OfflineMetrics = append(s.db.OfflineMetrics, record)
	
	// Cap the offline buffer to avoid infinite memory growth (e.g. max 5000 records)
	if len(s.db.OfflineMetrics) > 5000 {
		s.db.OfflineMetrics = s.db.OfflineMetrics[len(s.db.OfflineMetrics)-5000:]
	}
	
	return s.saveUnlocked()
}

func (s *Storage) GetQueuedMetrics() []MetricRecord {
	s.mu.RLock()
	defer s.mu.RUnlock()
	
	res := make([]MetricRecord, len(s.db.OfflineMetrics))
	copy(res, s.db.OfflineMetrics)
	return res
}

func (s *Storage) ClearQueuedMetrics(count int) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	
	if count >= len(s.db.OfflineMetrics) {
		s.db.OfflineMetrics = []MetricRecord{}
	} else {
		s.db.OfflineMetrics = s.db.OfflineMetrics[count:]
	}
	return s.saveUnlocked()
}
