package config

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"
)

var (
	// DefaultBackendURL can be overridden at compile time via:
	// -ldflags "-X negceslab-agent/config.DefaultBackendURL=http://localhost:5000"
	DefaultBackendURL = "https://intranet.ch.amrita.edu/negcesapi"
	DefaultWSURL      = ""
)

type Config struct {
	BackendURL         string `json:"backend_url"`
	WSURL              string `json:"ws_url"`
	MonitorInterval    int    `json:"monitor_interval"`
	MetricsInterval    int    `json:"metrics_interval"`
	LabName            string `json:"lab_name"`
	Department         string `json:"department"`
	MachineName        string `json:"machine_name"`
	RegistrationSecret string `json:"registration_secret"`
}

func getWSURL(backendURL string) string {
	if strings.HasPrefix(backendURL, "https://") {
		return strings.Replace(backendURL, "https://", "wss://", 1)
	}
	if strings.HasPrefix(backendURL, "http://") {
		return strings.Replace(backendURL, "http://", "ws://", 1)
	}
	return strings.Replace(backendURL, "http", "ws", 1)
}

func DefaultConfig() *Config {
	bURL := DefaultBackendURL
	if bURL == "" {
		bURL = "https://intranet.ch.amrita.edu/negcesapi"
	}
	wURL := DefaultWSURL
	if wURL == "" {
		wURL = getWSURL(bURL)
	}

	return &Config{
		BackendURL:         bURL,
		WSURL:              wURL,
		MonitorInterval:    10,
		MetricsInterval:    60,
		LabName:            "Negces Lab",
		Department:         "CSE",
		MachineName:        "",
		RegistrationSecret: "",
	}
}

func LoadConfig() (*Config, error) {
	exePath, err := os.Executable()
	if err != nil {
		return DefaultConfig(), err
	}
	configPath := filepath.Join(filepath.Dir(exePath), "agent_config.json")
	
	// Fallback to current working directory if path lacks config
	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		configPath = "agent_config.json"
	}

	data, err := ioutil.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			// Save default config if not found
			cfg := DefaultConfig()
			SaveConfig(cfg)
			return cfg, nil
		}
		return DefaultConfig(), err
	}

	var cfg Config
	if err := json.Unmarshal(data, &cfg); err != nil {
		return DefaultConfig(), err
	}

	def := DefaultConfig()

	// Validate / clean values
	if cfg.BackendURL == "" {
		cfg.BackendURL = def.BackendURL
	}
	if cfg.WSURL == "" {
		cfg.WSURL = def.WSURL
	}
	if cfg.MonitorInterval <= 0 {
		cfg.MonitorInterval = 10
	}
	if cfg.MetricsInterval <= 0 {
		cfg.MetricsInterval = 60
	}

	return &cfg, nil
}

func SaveConfig(cfg *Config) error {
	exePath, err := os.Executable()
	var configPath string
	if err != nil {
		configPath = "agent_config.json"
	} else {
		configPath = filepath.Join(filepath.Dir(exePath), "agent_config.json")
	}

	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}

	return ioutil.WriteFile(configPath, data, 0644)
}
