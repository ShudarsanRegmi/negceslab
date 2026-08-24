const ws = require("ws");
const url = require("url");
const Computer = require("../models/computer");
const Metric = require("../models/metric");
const { writeMetricPoint } = require("./influxService");
const getLogger = require("../utils/logger");
const logger = getLogger("telemetry");

// Map to track active websocket connections by computerId
const activeConnections = new Map();

const initWebSocketServer = (server) => {
  const wss = new ws.Server({ noServer: true });

  // Handle upgrade requests
  server.on("upgrade", (request, socket, head) => {
    let pathname = url.parse(request.url).pathname;
    // Normalize duplicate slashes (e.g., //ws/agent -> /ws/agent)
    pathname = pathname.replace(/\/+/g, "/");

    if (pathname === "/ws/agent") {
      wss.handleUpgrade(request, socket, head, (wsConnection) => {
        wss.emit("connection", wsConnection, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (socket, request) => {
    logger.info("New agent WebSocket connection initiated");
    let authenticatedComputer = null;

    // Heartbeat mechanism to detect dead connections
    socket.isAlive = true;
    socket.on("pong", () => {
      socket.isAlive = true;
    });

    socket.on("message", async (message) => {
      try {
        const payload = JSON.parse(message);

        // 1. Authenticate the socket connection
        if (payload.type === "auth") {
          const { token } = payload;
          if (!token) {
            socket.send(JSON.stringify({ type: "error", message: "Token is required" }));
            return socket.terminate();
          }

          const computer = await Computer.findOne({ agentToken: token });
          if (!computer) {
            socket.send(JSON.stringify({ type: "error", message: "Invalid agent token" }));
            return socket.terminate();
          }

          authenticatedComputer = computer;
          activeConnections.set(computer._id.toString(), socket);

          // Update computer status online and dynamic booted OS
          computer.isOnline = true;
          computer.lastSeen = new Date();

          if (payload.os) {
            const incomingOS = payload.os === "linux" ? "Linux" : (payload.os === "windows" ? "Windows" : "Other");
            
            // Auto-detect dual boot if the booted OS changes between Linux and Windows
            if (computer.agentSystemDetails?.operatingSystem && computer.agentSystemDetails.operatingSystem !== incomingOS) {
              computer.agentSystemDetails.isDualBoot = true;
            }

            if (!computer.agentSystemDetails) {
              computer.agentSystemDetails = { lastAgentRegistration: new Date() };
            }
            computer.agentSystemDetails.operatingSystem = incomingOS;
            if (incomingOS === "Linux") {
              computer.agentSystemDetails.osVersionLinux = payload.osVersion || "";
            } else if (incomingOS === "Windows") {
              computer.agentSystemDetails.osVersionWindows = payload.osVersion || "";
            }

            // Sync with user-facing systemDetails so dashboard/grid shows correct booted OS
            if (!computer.systemDetails) {
              computer.systemDetails = {};
            }
            computer.systemDetails.operatingSystem = incomingOS;
            if (payload.osVersion) {
              computer.systemDetails.osVersion = payload.osVersion;
            }
            computer.systemDetails.lastUpdated = new Date();
          }

          await computer.save();

          logger.info("Agent authenticated successfully", { computerName: computer.name, computerId: computer._id, os: payload.os || 'Unknown' });
          socket.send(JSON.stringify({ type: "auth_success", message: "Successfully authenticated" }));
          return;
        }

        // Must be authenticated for other types
        if (!authenticatedComputer) {
          socket.send(JSON.stringify({ type: "error", message: "Unauthenticated socket" }));
          return socket.terminate();
        }

        // 2. Process metrics updates
        if (payload.type === "metrics") {
          const data = payload.data || {};
          const now = new Date();

          // Update computer live metrics
          await Computer.findByIdAndUpdate(authenticatedComputer._id, {
            isOnline: true,
            lastSeen: now,
            $set: {
              liveMetrics: {
                cpuUtil: data.cpu_util || 0,
                ramUtil: data.ram_util || 0,
                gpuUtil: data.gpu_util || 0,
                gpuMemUsed: data.gpu_mem_used || 0,
                gpuMemTotal: data.gpu_mem_total || 0,
                netSentSpeed: data.net_sent_speed || 0,
                netRecvSpeed: data.net_recv_speed || 0,
                diskUtil: data.disk_util || 0,
                cpuTemp: data.cpu_temp || 0,
                gpuTemp: data.gpu_temp || 0,
              }
            }
          });

          // Write to InfluxDB v3 time-series database engine
          writeMetricPoint(
            authenticatedComputer._id,
            authenticatedComputer.name,
            data,
            now,
            authenticatedComputer.agentActiveSession || {}
          );

          // Save to time-series history database (MongoDB fallback)
          // To scale performance, the agent sends metrics every 10s. We save to history on the DB
          // only if 60 seconds have elapsed since the last stored metric to prevent bloating DB sizes.
          const lastMetric = await Metric.findOne({ computerId: authenticatedComputer._id }).sort({ timestamp: -1 });
          const shouldInsertHistory = !lastMetric || (now - lastMetric.timestamp >= 55000); // ~60 seconds

          if (shouldInsertHistory) {
            const histMetric = new Metric({
              computerId: authenticatedComputer._id,
              timestamp: now,
              cpuUtil: data.cpu_util || 0,
              ramUtil: data.ram_util || 0,
              gpuUtil: data.gpu_util || 0,
              gpuMemUsed: data.gpu_mem_used || 0,
              gpuMemTotal: data.gpu_mem_total || 0,
              netSentSpeed: data.net_sent_speed || 0,
              netRecvSpeed: data.net_recv_speed || 0,
              diskUtil: data.disk_util || 0,
              cpuTemp: data.cpu_temp || 0,
              gpuTemp: data.gpu_temp || 0,
            });
            await histMetric.save();
          }
        }
      } catch (err) {
        logger.error("WebSocket message processing failed", { error: err.message });
      }
    });

    socket.on("close", async () => {
      if (authenticatedComputer) {
        logger.info("Agent WebSocket connection closed", { computerName: authenticatedComputer.name, computerId: authenticatedComputer._id });
        activeConnections.delete(authenticatedComputer._id.toString());

        // Update online status in database
        try {
          await Computer.findByIdAndUpdate(authenticatedComputer._id, {
            isOnline: false,
            lastSeen: new Date(),
          });
        } catch (err) {
          logger.error("Failed to mark computer offline in DB", { computerId: authenticatedComputer._id, error: err.message });
        }
      }
    });

    socket.on("error", (err) => {
      logger.error("Agent WebSocket connection error", { error: err.message });
    });
  });

  // Keep-alive ping interval to clean dead connections
  const interval = setInterval(() => {
    wss.clients.forEach((wsClient) => {
      if (wsClient.isAlive === false) {
        return wsClient.terminate();
      }
      wsClient.isAlive = false;
      wsClient.ping();
    });
  }, 30000);

  wss.on("close", () => {
    clearInterval(interval);
    clearInterval(sweeperInterval);
  });

  // Heartbeat sweeper: Check for stale connections that didn't close cleanly
  const sweeperInterval = setInterval(async () => {
    try {
      const gracePeriod = new Date(Date.now() - 30 * 1000); // 30 seconds ago
      await Computer.updateMany(
        { isOnline: true, lastSeen: { $lt: gracePeriod } },
        { isOnline: false }
      );
    } catch (err) {
      logger.error("Error in agent heartbeat sweeper", { error: err.message });
    }
  }, 15000); // Run every 15 seconds

  logger.info("WebSocket Agent server bound to gateway upgrade pipeline");
  return wss;
};

module.exports = {
  initWebSocketServer,
};
