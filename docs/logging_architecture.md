# Negces Lab — Comprehensive Logging & Observability Architecture

This document proposes a standardized, structured logging architecture for the Negces Lab booking and telemetry ecosystem. It covers log levels, namespaces/categories, production ingestion pipelines, log rotation, Grafana Loki integration, and code-level cleanup strategies.

---

## 1. Current State & Pain Points
*   **Unstructured Logs**: The Node.js Express backend currently uses raw `console.log` and `console.error` statements. These are printed as unstructured plain-text strings to `stdout`.
*   **No Log Levels**: Critical database connection errors, warning pings, and verbose debugging messages are treated with the same severity level, making log filtering impossible.
*   **No Centralized Storage**: Logs are ephemeral and read directly from container runtimes (e.g. `podman logs`). There is no log persistence, causing historical logs to be lost during container rebuilds.
*   **Lack of Categories**: Authentication issues, WebSocket telemetry updates, and database query profiling are jumbled into a single stream.

---

## 2. Proposed Logging Architecture

To achieve production-grade observability, we will shift to **Structured JSON Logging** with a unified logging manager.

```
       +---------------------------------------------+
       |             Express Node Backend            |
       |  (Winston / Pino Logger Namespace Router)   |
       +---------------------------------------------+
            /         |             \           \
           /          |              \           \
          v           v               v           v
      [Auth]     [Telemetry]      [Bookings]   [Expiration]
        |             |               |           |
        +-------------+---------------+-----------+
                              |
                              v
                   (Structured JSON Logs)
                              |
                              v
                   [Local Log Files / STDOUT]
                              |
                              v
                  [Promtail Log Shipper]
                              |
                              v
                     [Grafana Loki DB]
                              |
                              v
                     [Grafana Web UI]
```

### 2.1 Standardized Log Levels
We will adopt the standard RFC 5424 log severity levels:

| Level | Severity | Description | Production Example |
| :--- | :--- | :--- | :--- |
| **FATAL** | Emergency (0) | System-wide crash or unrecoverable error. Process exits. | Database connection failed, port already in use. |
| **ERROR** | Error (3) | Runtime error that affects a specific request/operation. | Failed to save booking, Firebase token verification failed. |
| **WARN** | Warning (4) | Unexpected occurrences that don't halt execution. | InfluxDB API call timed out, fallback to MongoDB cache. |
| **INFO** | Info (6) | System state transitions and auditing events. | Successful device registration, booking approved, checkout complete. |
| **DEBUG** | Debug (7) | Detailed troubleshooting logs for development. | Ingress WebSocket metrics packet payload dump. |

---

## 3. Log Categorization & Namespaces

We will route logs into specific namespaces to allow easy filtering:

### 3.1 `auth`
Tracks security-sensitive operations.
*   **Events**: User registration, login attempts, Firebase ID token signature verification failures, invalid agent registration handshakes.
*   **Format Example**:
    ```json
    {"timestamp":"2026-08-24T21:07:00Z","level":"warn","category":"auth","message":"Registration handshake rejected: invalid token","clientIp":"192.168.1.105"}
    ```

### 3.2 `telemetry`
Tracks raw metrics ingestion flows.
*   **Events**: WebSocket client connection/disconnection, metrics writes to InfluxDB, downsampling ticks.
*   **Format Example**:
    ```json
    {"timestamp":"2026-08-24T21:07:02Z","level":"info","category":"telemetry","message":"Agent connected","systemName":"System1","systemId":"6a8c144f8ba4"}
    ```

### 3.3 `bookings`
Tracks user booking schedules.
*   **Events**: New booking creations, cancellations, check-in attempts, and temporary releases.

### 3.4 `expiration-service`
Tracks background cron loops and automated checkout operations.
*   **Events**: Midnight sweep checks, auto-checkouts, slot expiration actions.

### 3.5 `system`
General server events (server startup, database connection pooling, uncaught exceptions).

---

## 4. Web UI Log Browsing Integration (Grafana Loki + Promtail)

To view, search, and aggregate logs in a central dashboard, we will introduce **Grafana Loki** (log database) and **Promtail** (log agent/shipper) to the stack.

### 4.1 Podman Compose Stack Upgrades (`docker-compose.yml`)
We will add Loki and Promtail containers directly to the compose configuration:

```yaml
  loki:
    image: grafana/loki:latest
    container_name: loki
    ports:
      - "3100:3100"
    command: -config.file=/etc/loki/local-config.yaml
    volumes:
      - loki_data:/loki

  promtail:
    image: grafana/promtail:latest
    container_name: promtail
    volumes:
      - /var/log/negceslab:/var/log/negceslab
      - ./config/promtail.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    depends_on:
      - loki
```

### 4.2 Promtail Configuration (`config/promtail.yml`)
Promtail will parse log directories, extract namespaces/levels, and ship them to Loki:

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: negceslab-logs
    static_configs:
      - targets:
          - localhost
        labels:
          job: negceslab
          __path__: /var/log/negceslab/*.log
    pipeline_stages:
      - json:
          expressions:
            level: level
            category: category
            message: message
      - labels:
          level:
          category:
```

### 4.3 Grafana UI Log Browser
In Grafana (`http://localhost:3000`), we add Loki as a data source. Administrators can run **LogQL** queries to filter and troubleshoot logs:
*   Find all auth errors: `{job="negceslab", category="auth", level="error"}`
*   Inspect telemetry warnings: `{job="negceslab", category="telemetry", level="warn"}`

---

## 5. Node.js Backend Logger Implementation

We will replace console logs in the Express backend using **Winston**.

### 5.1 Winston Logger Setup (`server/utils/logger.js`)
```javascript
const winston = require('winston');
const path = require('path');

const logFormat = winston.format.printf(({ timestamp, level, category, message, ...meta }) => {
  return JSON.stringify({
    timestamp,
    level,
    category: category || 'system',
    message,
    ...meta
  });
});

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, category, message }) => {
    return `[${timestamp}] [${category || 'system'}] ${level}: ${message}`;
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    logFormat
  ),
  transports: [
    // Console log format switches based on environment
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production' ? logFormat : devFormat
    }),
    // Persistent Category files with rotation
    new winston.transports.File({ 
      filename: '/var/log/negceslab/error.log', 
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: '/var/log/negceslab/combined.log',
      maxsize: 10485760, // 10MB
      maxFiles: 5
    })
  ]
});

// Helper for namespaces
const getLogger = (category) => {
  return {
    fatal: (msg, meta) => logger.log('crit', msg, { category, ...meta }),
    error: (msg, meta) => logger.error(msg, { category, ...meta }),
    warn: (msg, meta) => logger.warn(msg, { category, ...meta }),
    info: (msg, meta) => logger.info(msg, { category, ...meta }),
    debug: (msg, meta) => logger.debug(msg, { category, ...meta })
  };
};

module.exports = getLogger;
```

---

## 6. Code Cleanup Strategy

To keep logs clean and highly useful, we will enforce these rules:
1.  **No `console.log()` allowed**: Reject PRs containing direct `console.log` statements.
2.  **No Telemetry Ingress bloat**: Dynamic metrics payloads must only be logged under the `DEBUG` level. Production `INFO` logs should only record socket connect/disconnect state transitions.
3.  **Sanitize logs**: Exclude user password hashes or raw auth credentials from logger metadata fields to preserve security compliance.
