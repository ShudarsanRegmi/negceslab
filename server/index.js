require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const admin = require("firebase-admin");
const path = require("path");

// Initialize Express app
const app = express();

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
  console.log("Firebase Admin initialized successfully");
} catch (error) {
  console.error("Error initializing Firebase Admin:", error.message);
  console.log("Please ensure Firebase service account key is properly configured");
  console.log(`Looking for service account at: ${process.env.FIREBASE_SERVICE_ACCOUNT_PATH || "./config/serviceAccountKey.json"}`);
}

// MongoDB Connection
if (!process.env.MONGODB_URI) {
  console.error("MONGODB_URI is not defined in .env file");
  process.exit(1);
}
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");

    // Initialize booking expiration service
    const { startExpirationService } = require("./services/bookingExpirationService");
    startExpirationService();
  })
  .catch((err) => console.error("MongoDB connection error:", err));

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

// Setup Swagger UI (only in development/localhost, not in production)
if (process.env.NODE_ENV !== "production") {
  setupSwagger(app);
}


app.get('/', (req, res)=>{
	res.status(200).json({'msg': "Welcome to Negces Lab Server API", 'Version': "3.0.3", "lastUpdatedOn": "Saturday 04 July 2026 06:41:14 PM IST"});
});

// Health endpoint
app.get('/health', async (req, res) => {
	try {
		// Check database connection
		const dbStatus = mongoose.connection.readyState;
		
		// Basic health info - production safe
		const healthInfo = {
			status: 'healthy',
			timestamp: new Date().toISOString(),
			version: "3.0.0",
			database: {
				connected: dbStatus === 1
			}
		};

		// If database is not connected, return 503 status
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

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


// Handle SIGTERM for Docker stop
process.on("SIGTERM", async () => {
  console.log("Received SIGTERM, shutting down gracefully...");

  // 1. Stop accepting new requests
  server.close(async () => {
    console.log("HTTP server closed");

    try {
      // 2. Close DB connections
      await mongoose.connection.close(false); // false = don't force
      console.log("MongoDB connection closed");

    } catch (err) {
      console.error("Error closing connections:", err);
    }

    // 3. Exit process
    process.exit(0);
  });
});

// (Optional) Also listen for SIGINT (Ctrl+C in local dev)
process.on("SIGINT", async () => {
  console.log("Received SIGINT (Ctrl+C)");
  process.emit("SIGTERM");
});
