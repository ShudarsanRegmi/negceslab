require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");
const getLogger = require("./utils/logger");
const logger = getLogger("system");

const promBundle = require("express-prom-bundle");

// Initialize Express app
const app = express();

// Prometheus Metrics Middleware (Exposes RED metrics at /metrics)
const metricsMiddleware = promBundle({
  includeMethod: true,
  includePath: true,
  includeStatusCode: true,
  includeUp: true,
  customLabels: { app: 'negceslab-backend' },
  promClient: {
    collectDefaultMetrics: {}
  },
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
});
app.use(metricsMiddleware);

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
try {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/serviceAccountKey.json";
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  logger.info("Firebase Admin initialized successfully");
} catch (error) {
  logger.error("Error initializing Firebase Admin", { error: error.message });
  logger.info("Please ensure Firebase service account key is properly configured");
  logger.info(`Looking for service account at: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/serviceAccountKey.json"}`);
}

// MongoDB Connection
if (!process.env.MONGODB_URI) {
  logger.fatal("MONGODB_URI is not defined in .env file");
  process.exit(1);
}
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    logger.info("Connected to MongoDB");

    // Initialize booking expiration service
    const { startExpirationService } = require("./services/bookingExpirationService");
    startExpirationService();
  })
  .catch((err) => logger.error("MongoDB connection error", { error: err.message }));

// Import routes
const authRoutes = require("./routes/auth");
const computerRoutes = require("./routes/computers");
const bookingRoutes = require("./routes/bookings");
const notificationRoutes = require("./routes/notifications");
const feedbackRoutes = require('./routes/feedback');
const systemDetailsRoutes = require('./routes/systemDetails');
const temporaryReleaseRoutes = require('./routes/temporaryReleases');
const achievementRoutes = require('./routes/achievements');
const superadminRoutes = require('./routes/superadmin');
const agentRoutes = require("./routes/agent");
const logRoutes = require("./routes/logs");
const policyRoutes = require("./routes/policy");
const { setupSwagger } = require("./swagger");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/computers", computerRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/system-details', systemDetailsRoutes);
app.use('/api/temporary-releases', temporaryReleaseRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/superadmin', superadminRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/policy", policyRoutes);

// Setup Swagger UI (only in development/localhost, not in production)
if (process.env.NODE_ENV !== "production") {
  setupSwagger(app);
}

app.get('/', (req, res) => {
	res.status(200).json({
		msg: "Welcome to Negces Lab Server API",
		version: "3.0.3",
		deploymentHash: process.env.GIT_COMMIT_HASH || "dev",
		lastUpdatedOn: process.env.GIT_COMMIT_DATE || new Date().toISOString(),
		branch: process.env.GIT_BRANCH || "main"
	});
});

// Health endpoint
app.get('/health', async (req, res) => {
	try {
		const dbStatus = mongoose.connection.readyState;
		const healthInfo = {
			status: 'healthy',
			timestamp: new Date().toISOString(),
			version: "3.0.0",
			database: {
				connected: dbStatus === 1
			}
		};

		if (dbStatus !== 1) {
			healthInfo.status = 'unhealthy';
			return res.status(503).json(healthInfo);
		}

		res.status(200).json(healthInfo);
	} catch (error) {
		res.status(503).json({
			status: 'unhealthy',
			timestamp: new Date().toISOString(),
			version: "3.0.1"
		});
	}
});

// 404 Fallback route logger
app.use((req, res) => {
  logger.warn(`404 Route Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error("Unhandled middleware error", { error: err.message, stack: err.stack });
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

// Initialize WebSocket telemetry for machine agents
const { initWebSocketServer } = require("./services/websocketService");
initWebSocketServer(server);


// Handle SIGTERM for Docker stop
process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down gracefully...");

  // 1. Stop accepting new requests
  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      // 2. Close DB connections
      await mongoose.connection.close(false); // false = don't force
      logger.info("MongoDB connection closed");

    } catch (err) {
      logger.error("Error closing connections", { error: err.message });
    }

    // 3. Exit process
    process.exit(0);
  });
});

// (Optional) Also listen for SIGINT (Ctrl+C in local dev)
process.on("SIGINT", async () => {
  logger.info("Received SIGINT (Ctrl+C)");
  process.emit("SIGTERM");
});
