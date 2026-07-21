package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"negceslab-agent/config"
	"negceslab-agent/storage"
	"negceslab-agent/sysinfo"

	"github.com/gorilla/websocket"
)

type Client struct {
	cfg     *config.Config
	store   *storage.Storage
	wsConn  *websocket.Conn
	mu      sync.Mutex
	isReady bool
}

func NewClient(cfg *config.Config, store *storage.Storage) *Client {
	return &Client{
		cfg:   cfg,
		store: store,
	}
}

// RegisterMachine sends specs to backend and caches auth token
func (c *Client) RegisterMachine(static *sysinfo.StaticInfo) error {
	url := fmt.Sprintf("%s/api/agent/register", c.cfg.BackendURL)
	
	body, err := json.Marshal(static)
	if err != nil {
		return err
	}

	resp, err := http.Post(url, "application/json", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to reach server: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server registration failed, code: %d", resp.StatusCode)
	}

	var res struct {
		MachineID string `json:"machine_id"`
		AuthToken string `json:"authToken"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return fmt.Errorf("failed to parse registration response: %w", err)
	}

	// Persist credentials
	err = c.store.SaveCredentials(storage.MachineCredentials{
		MachineID: res.MachineID,
		AuthToken: res.AuthToken,
	})
	if err != nil {
		return fmt.Errorf("failed to save registration details locally: %w", err)
	}

	fmt.Printf("Registered machine ID: %s\n", res.MachineID)
	return nil
}

// AttendanceCheckInOut submits attendance events via REST
func (c *Client) AttendanceCheckInOut(studentName, studentEmail, agenda, sessionType string, isCheckIn bool) error {
	creds := c.store.GetCredentials()
	if creds.AuthToken == "" {
		return fmt.Errorf("agent not registered with backend")
	}

	url := fmt.Sprintf("%s/api/agent/attendance", c.cfg.BackendURL)
	action := "checkout"
	if isCheckIn {
		action = "checkin"
	}

	payload := map[string]interface{}{
		"studentName":  studentName,
		"studentEmail": studentEmail,
		"agenda":       agenda,
		"sessionType":  sessionType,
		"action":       action,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", creds.AuthToken))

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("attendance API rejected request, code: %d", resp.StatusCode)
	}

	// Save check-in details locally
	attendance := storage.AttendanceState{
		StudentName:  studentName,
		StudentEmail: studentEmail,
		Agenda:       agenda,
		SessionType:  sessionType,
		CheckInTime:  time.Now(),
		CheckedIn:    isCheckIn,
	}
	_ = c.store.SaveAttendance(attendance)

	return nil
}

// SyncOfflineMetrics uploads queued offline metrics to server
func (c *Client) SyncOfflineMetrics() {
	creds := c.store.GetCredentials()
	if creds.AuthToken == "" {
		return
	}

	records := c.store.GetQueuedMetrics()
	if len(records) == 0 {
		return
	}

	fmt.Printf("Syncing %d offline metric records...\n", len(records))

	url := fmt.Sprintf("%s/api/agent/metrics", c.cfg.BackendURL)
	payload := map[string]interface{}{
		"metrics": records,
	}

	body, err := json.Marshal(payload)
	if err != nil {
		return
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", creds.AuthToken))

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("Offline sync failed (retry later): %v\n", err)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusOK {
		_ = c.store.ClearQueuedMetrics(len(records))
		fmt.Println("Offline metrics synchronized successfully")
	} else {
		fmt.Printf("Offline sync rejected, status code: %d\n", resp.StatusCode)
	}
}

// RunWSClient connects/reconnects WS for metrics telemetry
func (c *Client) StartWSMetricsStream(ctxDone <-chan struct{}, telemetryChan <-chan *sysinfo.DynamicMetrics) {
	go func() {
		for {
			select {
			case <-ctxDone:
				return
			default:
				c.connectAndStream(ctxDone, telemetryChan)
				// Wait 5 seconds before attempting reconnect
				time.Sleep(5 * time.Second)
			}
		}
	}()
}

func (c *Client) connectAndStream(ctxDone <-chan struct{}, telemetryChan <-chan *sysinfo.DynamicMetrics) {
	creds := c.store.GetCredentials()
	if creds.AuthToken == "" {
		fmt.Println("WS aborted: agent is not registered yet.")
		return
	}

	c.mu.Lock()
	wsUrl := fmt.Sprintf("%s/ws/agent", c.cfg.WSURL)
	fmt.Printf("Connecting to backend WebSocket: %s...\n", wsUrl)
	conn, _, err := websocket.DefaultDialer.Dial(wsUrl, nil)
	if err != nil {
		c.mu.Unlock()
		fmt.Printf("WS connection failed: %v\n", err)
		return
	}
	c.wsConn = conn
	c.isReady = true
	c.mu.Unlock()

	defer func() {
		c.mu.Lock()
		c.isReady = false
		if c.wsConn != nil {
			c.wsConn.Close()
		}
		c.mu.Unlock()
		fmt.Println("WS connection closed.")
	}()

	// 1. Authenticate WebSocket session
	authMsg := map[string]interface{}{
		"type":  "auth",
		"token": creds.AuthToken,
	}
	authData, _ := json.Marshal(authMsg)
	if err := conn.WriteMessage(websocket.TextMessage, authData); err != nil {
		return
	}

	// Read authentication response
	_, msg, err := conn.ReadMessage()
	if err != nil {
		return
	}
	var authResp struct {
		Type    string `json:"type"`
		Message string `json:"message"`
	}
	if err := json.Unmarshal(msg, &authResp); err != nil || authResp.Type != "auth_success" {
		fmt.Printf("WS Authentication failed: %s\n", authResp.Message)
		return
	}
	fmt.Println("WS connection successfully authenticated.")

	// Sync offline queue since link is healthy now
	go c.SyncOfflineMetrics()

	// Read loop to receive pings/pongs/errors
	go func() {
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				return
			}
		}
	}()

	// Stream dynamic metrics updates
	for {
		select {
		case <-ctxDone:
			return
		case metric, ok := <-telemetryChan:
			if !ok {
				return
			}

			payload := map[string]interface{}{
				"type": "metrics",
				"data": metric,
			}
			payloadData, _ := json.Marshal(payload)

			c.mu.Lock()
			err := conn.WriteMessage(websocket.TextMessage, payloadData)
			c.mu.Unlock()

			if err != nil {
				fmt.Printf("WS write failed (metric cached offline): %v\n", err)
				// Cache metrics locally due to socket failure
				metricMap := make(map[string]interface{})
				metricData, _ := json.Marshal(metric)
				_ = json.Unmarshal(metricData, &metricMap)
				_ = c.store.QueueMetric(metricMap)
				return // break out to trigger reconnect
			}
		}
	}
}

func (c *Client) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.isReady
}

type CurrentBookingResponse struct {
	BookingFound bool   `json:"bookingFound"`
	StudentName  string `json:"studentName"`
	StudentEmail string `json:"studentEmail"`
	Agenda       string `json:"agenda"`
	StartTime    string `json:"startTime"`
	EndTime      string `json:"endTime"`
}

func (c *Client) GetCurrentBooking() (*CurrentBookingResponse, error) {
	creds := c.store.GetCredentials()
	if creds.AuthToken == "" {
		return nil, fmt.Errorf("agent not registered")
	}

	url := fmt.Sprintf("%s/api/agent/current-booking", c.cfg.BackendURL)
	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", creds.AuthToken))

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("server returned status: %d", resp.StatusCode)
	}

	var res CurrentBookingResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}

	return &res, nil
}
