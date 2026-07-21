package config

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
)

type Config struct {
	BackendURL      string `json:"backend_url"`       // e.g. "https://negces.lab.example"
	WSURL           string `json:"ws_url"`            // e.g. "wss://negces.lab.example"
	MonitorInterval int    `json:"monitor_interval"`  // in seconds (default: 10)
	MetricsInterval int    `json:"metrics_interval"`  // in seconds (default: 60)
	LabName         string `json:"lab_name"`          // e.g. "Negces High Performance Lab"
	Department      string `json:"department"`        // e.g. "Computer Science"
	MachineName     string `json:"machine_name"`       // e.g. "System1" (overrides local OS hostname if set for testing)
}

func DefaultConfig() *Config {
	return &Config{
		BackendURL:      "http://localhost:5000",
		WSURL:           "ws://localhost:5000",
		MonitorInterval: 10,
		MetricsInterval: 60,
		LabName:         "Negces Lab",
		Department:      "CSE",
		MachineName:     "",
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

	// Validate / clean values
	if cfg.BackendURL == "" {
		cfg.BackendURL = "http://localhost:5000"
	}
	if cfg.WSURL == "" {
		cfg.WSURL = "ws://localhost:5000"
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
