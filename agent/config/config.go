package config

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path/filepath"
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

func DefaultConfig() *Config {
	return &Config{
		BackendURL:         "https://intranet.ch.amrita.edu/negcesapi",
		WSURL:              "wss://intranet.ch.amrita.edu/negcesapi",
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

	// Validate / clean values
	if cfg.BackendURL == "" {
		cfg.BackendURL = "https://intranet.ch.amrita.edu/negcesapi"
	}
	if cfg.WSURL == "" {
		cfg.WSURL = "wss://intranet.ch.amrita.edu/negcesapi"
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
