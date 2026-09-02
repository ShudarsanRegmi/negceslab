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

func (c *Client) GetConfig() *config.Config {
	return c.cfg
}

type SystemInfo struct {
	ID   string `json:"_id"`
	Name string `json:"name"`
}

func (c *Client) FetchAvailableSystems() ([]SystemInfo, error) {
	url := fmt.Sprintf("%s/api/computers/public", c.cfg.BackendURL)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("failed to fetch systems, status: %d", resp.StatusCode)
	}

	var systems []SystemInfo
	if err := json.NewDecoder(resp.Body).Decode(&systems); err != nil {
		return nil, err
	}
	return systems, nil
}

// RegisterMachine sends specs to backend, queues a confirmation request, and polls until administrator confirms
func (c *Client) RegisterMachine(static *sysinfo.StaticInfo) error {
	url := fmt.Sprintf("%s/api/agent/register", c.cfg.BackendURL)
	
	body, err := json.Marshal(static)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	
	// Bind active 30-min UI rotation registration token to authenticate request
	if c.cfg.RegistrationSecret != "" {
		req.Header.Set("X-Registration-Token", c.cfg.RegistrationSecret)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("failed to reach server: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return fmt.Errorf("server rejected registration request: invalid or expired registration token")
	}

	if resp.StatusCode != http.StatusAccepted && resp.StatusCode != http.StatusOK {
		return fmt.Errorf("server registration request failed, code: %d", resp.StatusCode)
	}

	var initRes struct {
		Status     string `json:"status"`
		RequestId  string `json:"requestId"`
		TempToken  string `json:"tempToken"`
		SystemName string `json:"systemName"`
		Message    string `json:"message"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&initRes); err != nil {
		return fmt.Errorf("failed to parse registration queue response: %w", err)
	}

	fmt.Printf("[QUEUE] Request submitted for System: '%s'. Status: PENDING.\n", initRes.SystemName)
	fmt.Println("Waiting for Lab Administrator approval in Admin Panel...")

	// 2. Poll Status Endpoint until Approved or Rejected
	pollUrl := fmt.Sprintf("%s/api/agent/register/status/%s", c.cfg.BackendURL, initRes.RequestId)
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	for {
		<-ticker.C
		pollReq, err := http.NewRequest("GET", pollUrl, nil)
		if err != nil {
			continue
		}
		pollReq.Header.Set("X-Temp-Token", initRes.TempToken)

		pollResp, err := client.Do(pollReq)
		if err != nil {
			fmt.Printf("Connection error during status check: %v. Retrying...\n", err)
			continue
		}

		if pollResp.StatusCode != http.StatusOK {
			pollResp.Body.Close()
			continue
		}

		var pollRes struct {
			Status     string `json:"status"`
			MachineID  string `json:"machineId"`
			SystemName string `json:"systemName"`
			AuthToken  string `json:"authToken"`
			Message    string `json:"message"`
		}

		err = json.NewDecoder(pollResp.Body).Decode(&pollRes)
		pollResp.Body.Close()
		if err != nil {
			continue
		}

		if pollRes.Status == "pending" {
			// Print visual keep-alive pulse
			fmt.Print(".")
			continue
		}

		if pollRes.Status == "rejected" {
			fmt.Println("\n[DECLINED] Registration request was declined by the administrator.")
			return fmt.Errorf("registration rejected by administrator")
		}

		if pollRes.Status == "approved" {
			fmt.Println("\n[APPROVED] Administrator confirmed agent registration!")

			// Persist formal credentials
			err = c.store.SaveCredentials(storage.MachineCredentials{
				MachineID: pollRes.MachineID,
				AuthToken: pollRes.AuthToken,
			})
			if err != nil {
				return fmt.Errorf("failed to save registration details locally: %w", err)
			}

			fmt.Printf("Successfully registered as System: '%s' (ID: %s)\n", pollRes.SystemName, pollRes.MachineID)
			return nil
		}
	}
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
	wsUrlBase := c.cfg.WSURL
	if len(wsUrlBase) > 0 && wsUrlBase[len(wsUrlBase)-1] == '/' {
		wsUrlBase = wsUrlBase[:len(wsUrlBase)-1]
	}
	wsUrl := fmt.Sprintf("%s/ws/agent", wsUrlBase)
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
	osName, osVer := sysinfo.GetOSAndVersion()
	authMsg := map[string]interface{}{
		"type":      "auth",
		"token":     creds.AuthToken,
		"os":        osName,
		"osVersion": osVer,
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
