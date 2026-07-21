const ws = require("ws");
const url = require("url");
const Computer = require("../models/computer");
const Metric = require("../models/metric");
const { writeMetricPoint } = require("./influxService");

// Map to track active websocket connections by computerId
const activeConnections = new Map();

const initWebSocketServer = (server) => {
  const wss = new ws.Server({ noServer: true });

  // Handle upgrade requests
  server.on("upgrade", (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    if (pathname === "/ws/agent") {
      wss.handleUpgrade(request, socket, head, (wsConnection) => {
        wss.emit("connection", wsConnection, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on("connection", (socket, request) => {
    console.log("New agent WebSocket connection initiated.");
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

          // Update computer status online
          computer.isOnline = true;
          computer.lastSeen = new Date();
          await computer.save();

          console.log(`Agent authenticated for machine: ${computer.name} (${computer._id})`);
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
        console.error("WebSocket message error:", err);
      }
    });

    socket.on("close", async () => {
      if (authenticatedComputer) {
        console.log(`Agent connection closed for machine: ${authenticatedComputer.name}`);
        activeConnections.delete(authenticatedComputer._id.toString());

        // Update online status in database
        try {
          await Computer.findByIdAndUpdate(authenticatedComputer._id, {
            isOnline: false,
            lastSeen: new Date(),
          });
        } catch (err) {
          console.error("Failed to mark computer offline:", err);
        }
      }
    });

    socket.on("error", (err) => {
      console.error("Agent socket error:", err);
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
      console.error("Error in agent heartbeat sweeper:", err);
    }
  }, 15000); // Run every 15 seconds

  console.log("WebSocket Agent server bound to gateway upgrade pipeline");
  return wss;
};

module.exports = {
  initWebSocketServer,
};
