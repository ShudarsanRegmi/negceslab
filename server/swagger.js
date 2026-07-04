const swaggerUi = require("swagger-ui-express");
const swaggerJsdoc = require("swagger-jsdoc");

// Premium dark mode styles for Swagger UI
const customCss = `
  .swagger-ui {
    background-color: #0b0f19;
    color: #cbd5e1;
    font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
  }
  .swagger-ui .info .title {
    color: #f8fafc;
    font-size: 2.5rem;
    font-weight: 700;
  }
  .swagger-ui .info p, .swagger-ui .info li, .swagger-ui .info td, .swagger-ui .info tr {
    color: #94a3b8;
    font-size: 0.95rem;
  }
  .swagger-ui .scheme-container {
    background: #0f172a;
    box-shadow: none;
    border-bottom: 1px solid #1e293b;
    padding: 20px 0;
  }
  .swagger-ui select {
    background: #1e293b;
    color: #f8fafc;
    border: 1px solid #334155;
    border-radius: 6px;
    padding: 6px 10px;
  }
  .swagger-ui .opblock {
    background: #0f172a;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
    border: 1px solid #1e293b;
    margin: 0 0 15px;
    overflow: hidden;
  }
  .swagger-ui .opblock .opblock-summary {
    border-bottom: 1px solid #1e293b;
    padding: 12px 20px;
  }
  .swagger-ui .opblock-tag {
    border-bottom: 1px solid #1e293b;
    color: #f8fafc;
    font-size: 1.3rem;
    font-weight: 600;
    padding: 15px 20px 10px;
  }
  .swagger-ui .opblock-tag:hover {
    background: rgba(30, 41, 59, 0.5);
  }
  .swagger-ui .opblock.opblock-get {
    background: rgba(59, 130, 246, 0.03);
    border-color: rgba(59, 130, 246, 0.3);
  }
  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #2563eb;
    border-radius: 6px;
    font-weight: 700;
  }
  .swagger-ui .opblock.opblock-post {
    background: rgba(16, 185, 129, 0.03);
    border-color: rgba(16, 185, 129, 0.3);
  }
  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #059669;
    border-radius: 6px;
    font-weight: 700;
  }
  .swagger-ui .opblock.opblock-put {
    background: rgba(245, 158, 11, 0.03);
    border-color: rgba(245, 158, 11, 0.3);
  }
  .swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: #d97706;
    border-radius: 6px;
    font-weight: 700;
  }
  .swagger-ui .opblock.opblock-delete {
    background: rgba(239, 68, 68, 0.03);
    border-color: rgba(239, 68, 68, 0.3);
  }
  .swagger-ui .opblock.opblock-delete .opblock-summary-method {
    background: #dc2626;
    border-radius: 6px;
    font-weight: 700;
  }
  .swagger-ui .opblock .opblock-summary-path {
    color: #e2e8f0;
    font-weight: 600;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  }
  .swagger-ui .opblock .opblock-summary-description {
    color: #94a3b8;
  }
  .swagger-ui .btn {
    background: #1e293b;
    color: #e2e8f0;
    border: 1px solid #334155;
    border-radius: 6px;
    font-weight: 500;
    padding: 6px 16px;
    transition: all 0.2s;
  }
  .swagger-ui .btn:hover {
    background: #334155;
    color: #f8fafc;
  }
  .swagger-ui .btn.authorize {
    background: transparent;
    color: #10b981;
    border-color: #10b981;
  }
  .swagger-ui .btn.authorize:hover {
    background: #10b981;
    color: #ffffff;
  }
  .swagger-ui .btn.authorize svg {
    fill: #10b981;
  }
  .swagger-ui .btn.authorize:hover svg {
    fill: #ffffff;
  }
  .swagger-ui .dialog-ux .modal-ux {
    background-color: #0f172a;
    border: 1px solid #1e293b;
    border-radius: 12px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
  }
  .swagger-ui .dialog-ux .modal-ux-header {
    border-bottom: 1px solid #1e293b;
    padding: 15px 25px;
  }
  .swagger-ui .dialog-ux .modal-ux-header h3 {
    color: #f8fafc;
    font-weight: 600;
  }
  .swagger-ui .dialog-ux .modal-ux-content {
    color: #94a3b8;
    padding: 20px 25px;
  }
  .swagger-ui .model {
    color: #cbd5e1;
  }
  .swagger-ui .model-title {
    color: #f8fafc;
  }
  .swagger-ui section.models {
    border: 1px solid #1e293b;
    background: #0f172a;
    border-radius: 8px;
    margin: 30px 0;
  }
  .swagger-ui section.models.open h4 {
    border-bottom: 1px solid #1e293b;
    color: #f8fafc;
    padding: 10px 20px;
  }
  .swagger-ui section.models h4 {
    color: #94a3b8;
  }
  .swagger-ui .prop-type {
    color: #3b82f6;
  }
  .swagger-ui .prop-format {
    color: #64748b;
  }
  .swagger-ui table thead tr td, .swagger-ui table thead tr th {
    border-bottom: 1px solid #1e293b;
    color: #94a3b8;
  }
  .swagger-ui .response-col_status {
    color: #f8fafc;
    font-weight: 600;
  }
  .swagger-ui .response-col_links {
    color: #94a3b8;
  }
  .swagger-ui .tab li button.tablinks {
    color: #94a3b8;
    font-weight: 500;
  }
  .swagger-ui .tab li.active button.tablinks {
    color: #f8fafc;
    border-color: #3b82f6;
  }
  .swagger-ui .markdown p, .swagger-ui .markdown pre {
    color: #94a3b8;
  }
  .swagger-ui input[type=text], .swagger-ui textarea {
    background: #1e293b;
    color: #f8fafc;
    border: 1px solid #334155;
    padding: 8px 12px;
    border-radius: 6px;
    width: 100%;
    box-sizing: border-box;
  }
  .swagger-ui input[type=text]:focus, .swagger-ui textarea:focus {
    border-color: #3b82f6;
    outline: none;
  }
  .swagger-ui .parameter__name {
    color: #e2e8f0;
    font-weight: 600;
  }
  .swagger-ui .parameter__type {
    color: #3b82f6;
  }
  .swagger-ui .parameter__in {
    color: #64748b;
    font-style: italic;
  }
`;

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Negces Lab Tracking System API",
    version: "3.0.2",
    description: `API Documentation for the Negces Lab Tracking System backend.
    
    ### Authentication
    Most endpoints require authentication using a **Firebase ID Token**. 
    Obtain the ID token on the client side via Firebase Auth and send it in the HTTP \`Authorization\` header as:
    \`\`\`http
    Authorization: Bearer <your-firebase-id-token>
    \`\`\`
    
    Use the **Authorize** button on the top right to set the token for testing requests directly from this UI.`,
  },
  servers: [
    {
      url: "/",
      description: "Current Host Server (Relative)",
    },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Input your Firebase ID Token.",
      },
    },
    schemas: {
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          firebaseUid: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Computer: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          location: { type: "string" },
          specifications: { type: "string" },
          status: { type: "string", enum: ["available", "maintenance", "reserved"] },
          systemDetails: {
            type: "object",
            properties: {
              operatingSystem: { type: "string", enum: ["Windows", "Linux", "macOS", "Dual Boot", "WSL", "VM on Linux", "Other"] },
              osVersion: { type: "string" },
              architecture: { type: "string", enum: ["x86_64", "ARM64", "Other"] },
              processor: { type: "string" },
              ram: { type: "string" },
              storage: { type: "string" },
              gpu: { type: "string" },
              installedSoftware: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    version: { type: "string" },
                    category: { type: "string", enum: ["Development", "Design", "Analysis", "Office", "Other"] },
                    icon: { type: "string" },
                  },
                },
              },
              additionalNotes: { type: "string" },
              lastUpdated: { type: "string", format: "date-time" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
        },
      },
      Booking: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          computerId: { type: "string" },
          startDate: { type: "string", format: "date" },
          endDate: { type: "string", format: "date" },
          startTime: { type: "string", description: "HH:MM" },
          endTime: { type: "string", description: "HH:MM" },
          reason: { type: "string" },
          status: { type: "string", enum: ["pending", "approved", "rejected", "cancelled", "completed"] },
          rejectionReason: { type: "string" },
          requiresGPU: { type: "boolean" },
          gpuMemoryRequired: { type: "number" },
          problemStatement: { type: "string" },
          datasetType: { type: "string", enum: ["Image", "Video", "Audio", "Satellite", "Text", "Tabular", "Time Series", "Other"] },
          datasetSize: {
            type: "object",
            properties: {
              value: { type: "number" },
              unit: { type: "string", enum: ["MB", "GB", "TB"] },
            },
          },
          datasetLink: { type: "string" },
          bottleneckExplanation: { type: "string" },
          mentor: { type: "string" },
          isTemporaryBooking: { type: "boolean" },
          originalBookingId: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Feedback: {
        type: "object",
        properties: {
          id: { type: "string" },
          fullName: { type: "string" },
          email: { type: "string" },
          subject: { type: "string", enum: ["General Feedback", "Technical Support", "Equipment Issue", "Booking Inquiry", "Suggestion", "Complaint", "Other"] },
          message: { type: "string" },
          status: { type: "string", enum: ["pending", "resolved", "in_progress"] },
          adminResponse: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string" },
          userId: { type: "string" },
          title: { type: "string" },
          message: { type: "string" },
          type: { type: "string", enum: ["info", "success", "warning", "error"] },
          isRead: { type: "boolean" },
          createdAt: { type: "string", format: "date-time" },
          metadata: { type: "object" },
        },
      },
      TemporaryReleaseDetail: {
        type: "object",
        properties: {
          id: { type: "string" },
          bookingId: { type: "string" },
          userId: { type: "string" },
          releaseNumber: { type: "number" },
          releasedDates: { type: "array", items: { type: "string", format: "date" } },
          reason: { type: "string" },
          status: { type: "string", enum: ["active", "cancelled", "partially_booked"] },
          bookingDetails: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", format: "date" },
                isBooked: { type: "boolean" },
                tempBookingId: { type: "string" },
                bookedBy: { type: "string" },
                bookedAt: { type: "string", format: "date-time" },
              },
            },
          },
          releaseContext: {
            type: "object",
            properties: {
              userMessage: { type: "string" },
              releaseType: { type: "string", enum: ["single_day", "multiple_days", "range", "admin_created"] },
              isEmergency: { type: "boolean" },
              createdByAdmin: { type: "boolean" },
              adminId: { type: "string" },
            },
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Achievement: {
        type: "object",
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          author: { type: "string" },
          content: { type: "string" },
          excerpt: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          date: { type: "string" },
          status: { type: "string", enum: ["draft", "published", "hidden"] },
          featuredImage: { type: "string" },
          createdBy: { type: "string" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          publishedAt: { type: "string", format: "date-time" },
        },
      },
    },
  },
  paths: {
    // Auth Routes
    "/api/auth/register": {
      post: {
        tags: ["Authentication"],
        summary: "Register new user",
        description: "Registers a user in MongoDB using Firebase ID Token verified UID.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "John Doe" },
                  email: { type: "string", example: "john@example.com" },
                },
                required: ["name", "email"],
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          200: { description: "User already exists", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { description: "Unauthorized / Invalid Token" },
          500: { description: "Server Error" },
        },
      },
    },
    "/api/auth/profile": {
      get: {
        tags: ["Authentication"],
        summary: "Get current user profile",
        description: "Returns the profile details of the authenticated user.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Profile retrieved successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          401: { description: "Unauthorized / Invalid Token" },
          404: { description: "User not found" },
        },
      },
    },
    "/api/auth/role/{userId}": {
      put: {
        tags: ["Authentication"],
        summary: "Update user role",
        description: "Update the role of a specific user. Admin access required.",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "userId", in: "path", required: true, schema: { type: "string" }, description: "MongoDB Document ID of target user" },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  role: { type: "string", enum: ["user", "admin"], example: "admin" },
                },
                required: ["role"],
              },
            },
          },
        },
        responses: {
          200: { description: "Role updated successfully", content: { "application/json": { schema: { $ref: "#/components/schemas/User" } } } },
          403: { description: "Forbidden / Admin required" },
          404: { description: "User not found" },
        },
      },
    },
    // Computers Routes
    "/api/computers/public": {
      get: {
        tags: ["Computers"],
        summary: "Get all computers (Public)",
        description: "Retrieves a list of all computers with all booking histories. No token required.",
        responses: {
          200: { description: "Computers list retrieved", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Computer" } } } } },
        },
      },
    },
    "/api/computers/public/with-bookings": {
      get: {
        tags: ["Computers"],
        summary: "Get computers with active/upcoming bookings (Public)",
        description: "Retrieves all computers with current and upcoming active bookings populated. No token required.",
        responses: {
          200: { description: "Computers with bookings list", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Computer" } } } } },
        },
      },
    },
    "/api/computers": {
      get: {
        tags: ["Computers"],
        summary: "Get all computers (Authenticated)",
        description: "Retrieves all computers. Requires authentication.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Success", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Computer" } } } } },
          401: { description: "Unauthorized" },
        },
      },
      post: {
        tags: ["Computers"],
        summary: "Create a new computer",
        description: "Admin only. Add a new system.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "Lab-PC-05" },
                  location: { type: "string", example: "Row A, Desk 2" },
                  specifications: { type: "string", example: "i9, 64GB RAM, RTX 4090" },
                  status: { type: "string", enum: ["available", "maintenance", "reserved"], default: "available" },
                },
                required: ["name", "location"],
              },
            },
          },
        },
        responses: {
          201: { description: "Computer created", content: { "application/json": { schema: { $ref: "#/components/schemas/Computer" } } } },
          403: { description: "Forbidden" },
        },
      },
    },
    "/api/computers/{id}": {
      put: {
        tags: ["Computers"],
        summary: "Update computer details",
        description: "Admin only. Update system details.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  location: { type: "string" },
                  specifications: { type: "string" },
                  status: { type: "string", enum: ["available", "maintenance", "reserved"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated computer object", content: { "application/json": { schema: { $ref: "#/components/schemas/Computer" } } } },
          403: { description: "Forbidden" },
          404: { description: "Not Found" },
        },
      },
      delete: {
        tags: ["Computers"],
        summary: "Delete computer",
        description: "Admin only. Deletes a computer system.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Computer deleted successfully" },
          403: { description: "Forbidden" },
          404: { description: "Not Found" },
        },
      },
    },
    // Bookings Routes
    "/api/bookings": {
      get: {
        tags: ["Bookings"],
        summary: "Get all bookings",
        description: "Retrieves bookings. If user, retrieves user's bookings. If admin, retrieves all bookings.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Success", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Booking" } } } } },
        },
      },
      post: {
        tags: ["Bookings"],
        summary: "Create a new booking",
        description: "Submit a new booking request for a computer.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  computerId: { type: "string" },
                  startDate: { type: "string", format: "date", example: "2026-07-02" },
                  endDate: { type: "string", format: "date", example: "2026-07-05" },
                  startTime: { type: "string", example: "09:00" },
                  endTime: { type: "string", example: "18:00" },
                  reason: { type: "string", example: "Deep learning model training" },
                  requiresGPU: { type: "boolean", default: true },
                  gpuMemoryRequired: { type: "number", example: 12 },
                  problemStatement: { type: "string", example: "Training ResNet-50 on ImageNet" },
                  datasetType: { type: "string", enum: ["Image", "Video", "Audio", "Satellite", "Text", "Tabular", "Time Series", "Other"] },
                  datasetSize: {
                    type: "object",
                    properties: {
                      value: { type: "number", example: 10 },
                      unit: { type: "string", enum: ["MB", "GB", "TB"], default: "GB" },
                    },
                  },
                  datasetLink: { type: "string", example: "https://kaggle.com/datasets/..." },
                  bottleneckExplanation: { type: "string", example: "Local machine doesn't have sufficient VRAM." },
                  mentor: { type: "string", example: "Dr. Smith" },
                },
                required: ["computerId", "startDate", "endDate", "startTime", "endTime", "reason", "requiresGPU", "problemStatement", "datasetType", "datasetSize", "datasetLink", "bottleneckExplanation"],
              },
            },
          },
        },
        responses: {
          201: { description: "Booking created", content: { "application/json": { schema: { $ref: "#/components/schemas/Booking" } } } },
        },
      },
    },
    "/api/bookings/current": {
      get: {
        tags: ["Bookings"],
        summary: "Get current active booking",
        description: "Retrieves the currently running booking for the authenticated user.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Current booking info", content: { "application/json": { schema: { $ref: "#/components/schemas/Booking" } } } },
          404: { description: "No active booking found" },
        },
      },
    },
    "/api/bookings/{id}/status": {
      put: {
        tags: ["Bookings"],
        summary: "Update booking status",
        description: "Admin only. Approve or reject a booking request.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["approved", "rejected"], example: "approved" },
                  rejectionReason: { type: "string", example: "PC undergoing maintenance" },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          200: { description: "Booking status updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Booking" } } } },
        },
      },
    },
    "/api/bookings/{id}": {
      delete: {
        tags: ["Bookings"],
        summary: "Cancel booking",
        description: "Allows users to cancel their own bookings or admins to delete bookings.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Booking cancelled successfully" },
        },
      },
    },
    "/api/bookings/{id}/time": {
      put: {
        tags: ["Bookings"],
        summary: "Update booking time slot",
        description: "Allows changing times on an active/upcoming booking.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  startTime: { type: "string", example: "10:00" },
                  endTime: { type: "string", example: "17:00" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Booking times updated", content: { "application/json": { schema: { $ref: "#/components/schemas/Booking" } } } },
        },
      },
    },
    // Notifications Routes
    "/api/notifications": {
      get: {
        tags: ["Notifications"],
        summary: "Get user notifications",
        description: "Retrieves all notifications for the logged-in user.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Success", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Notification" } } } } },
        },
      },
      post: {
        tags: ["Notifications"],
        summary: "Create notification",
        description: "Send notification to a specific user. Admin only.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  userId: { type: "string", description: "Target Firebase UID" },
                  title: { type: "string" },
                  message: { type: "string" },
                  type: { type: "string", enum: ["info", "success", "warning", "error"], default: "info" },
                },
                required: ["userId", "title", "message"],
              },
            },
          },
        },
        responses: {
          201: { description: "Notification created", content: { "application/json": { schema: { $ref: "#/components/schemas/Notification" } } } },
        },
      },
    },
    "/api/notifications/{id}/read": {
      put: {
        tags: ["Notifications"],
        summary: "Mark notification as read",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Updated notification details" },
        },
      },
    },
    "/api/notifications/read-all": {
      put: {
        tags: ["Notifications"],
        summary: "Mark all user notifications as read",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "All marked as read" },
        },
      },
    },
    // Feedback Routes
    "/api/feedback": {
      post: {
        tags: ["Feedback"],
        summary: "Submit new feedback",
        description: "Public route to send inquiry, suggestion, complaint, or technical issue.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  fullName: { type: "string" },
                  email: { type: "string" },
                  subject: { type: "string", enum: ["General Feedback", "Technical Support", "Equipment Issue", "Booking Inquiry", "Suggestion", "Complaint", "Other"] },
                  message: { type: "string" },
                },
                required: ["fullName", "email", "subject", "message"],
              },
            },
          },
        },
        responses: {
          201: { description: "Feedback submitted successfully" },
        },
      },
      get: {
        tags: ["Feedback"],
        summary: "Get all feedback submissions",
        description: "Admin only.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "List of feedback documents", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Feedback" } } } } },
        },
      },
    },
    "/api/feedback/{id}/status": {
      put: {
        tags: ["Feedback"],
        summary: "Update feedback status / response",
        description: "Admin only. Mark as resolved or in progress, adding an optional admin message response.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  status: { type: "string", enum: ["pending", "resolved", "in_progress"] },
                  adminResponse: { type: "string" },
                },
                required: ["status"],
              },
            },
          },
        },
        responses: {
          200: { description: "Updated feedback status" },
        },
      },
    },
    // Achievements Routes
    "/api/achievements/public": {
      get: {
        tags: ["Achievements"],
        summary: "Get all published achievements (Public)",
        responses: {
          200: { description: "List of published achievements", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Achievement" } } } } },
        },
      },
    },
    "/api/achievements": {
      get: {
        tags: ["Achievements"],
        summary: "Get all achievements",
        description: "Admin only. Retrieves drafts and published accomplishments.",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Success", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Achievement" } } } } },
        },
      },
      post: {
        tags: ["Achievements"],
        summary: "Create new achievement",
        description: "Admin only.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  author: { type: "string" },
                  content: { type: "string" },
                  excerpt: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  date: { type: "string", example: "2026-06" },
                  status: { type: "string", enum: ["draft", "published", "hidden"] },
                  featuredImage: { type: "string" },
                },
                required: ["title", "author", "content", "tags", "date"],
              },
            },
          },
        },
        responses: {
          201: { description: "Achievement created" },
        },
      },
    },
    "/api/achievements/{id}": {
      get: {
        tags: ["Achievements"],
        summary: "Get achievement details",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Success", content: { "application/json": { schema: { $ref: "#/components/schemas/Achievement" } } } },
        },
      },
      put: {
        tags: ["Achievements"],
        summary: "Update achievement details",
        description: "Admin only.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  author: { type: "string" },
                  content: { type: "string" },
                  excerpt: { type: "string" },
                  tags: { type: "array", items: { type: "string" } },
                  status: { type: "string", enum: ["draft", "published", "hidden"] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Updated successfully" },
        },
      },
      delete: {
        tags: ["Achievements"],
        summary: "Delete achievement",
        description: "Admin only.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Deleted successfully" },
        },
      },
    },
    // System Details Routes
    "/api/system-details/public/software-pool": {
      get: {
        tags: ["System Details"],
        summary: "Get software pool (Public)",
        description: "Retrieves names and details of all software installed across the pool of lab computers.",
        responses: {
          200: { description: "Success" },
        },
      },
    },
    "/api/system-details/public": {
      get: {
        tags: ["System Details"],
        summary: "Get list of computer names and configurations (Public)",
        responses: {
          200: { description: "Success" },
        },
      },
    },
    "/api/system-details/{computerId}": {
      get: {
        tags: ["System Details"],
        summary: "Get specific computer hardware & software specs",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "computerId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Specs returned" },
        },
      },
      put: {
        tags: ["System Details"],
        summary: "Update complete specifications of computer system",
        description: "Admin/user token authorized.",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "computerId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  operatingSystem: { type: "string" },
                  osVersion: { type: "string" },
                  architecture: { type: "string" },
                  processor: { type: "string" },
                  ram: { type: "string" },
                  storage: { type: "string" },
                  gpu: { type: "string" },
                  additionalNotes: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Specs updated" },
        },
      },
    },
    "/api/system-details/{computerId}/software": {
      post: {
        tags: ["System Details"],
        summary: "Add software to computer",
        security: [{ BearerAuth: [] }],
        parameters: [{ name: "computerId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string", example: "MATLAB" },
                  version: { type: "string", example: "R2024a" },
                  category: { type: "string", enum: ["Development", "Design", "Analysis", "Office", "Other"], default: "Analysis" },
                  icon: { type: "string", default: "💻" },
                },
                required: ["name"],
              },
            },
          },
        },
        responses: {
          201: { description: "Software added successfully" },
        },
      },
    },
    "/api/system-details/{computerId}/software/{softwareIndex}": {
      delete: {
        tags: ["System Details"],
        summary: "Remove software from computer",
        security: [{ BearerAuth: [] }],
        parameters: [
          { name: "computerId", in: "path", required: true, schema: { type: "string" } },
          { name: "softwareIndex", in: "path", required: true, schema: { type: "integer" } },
        ],
        responses: {
          200: { description: "Software removed successfully" },
        },
      },
    },
    // Temporary Releases Routes
    "/api/temporary-releases/create": {
      post: {
        tags: ["Temporary Releases"],
        summary: "Release booked slot dates temporarily",
        description: "Allows a user to temporarily release dates of their active booking so other users can book them.",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  bookingId: { type: "string" },
                  releasedDates: { type: "array", items: { type: "string", format: "date" }, example: ["2026-07-03"] },
                  reason: { type: "string", example: "Away on field trip" },
                  releaseType: { type: "string", enum: ["single_day", "multiple_days", "range"], default: "single_day" },
                },
                required: ["bookingId", "releasedDates", "reason"],
              },
            },
          },
        },
        responses: {
          201: { description: "Releases registered" },
        },
      },
    },
    "/api/temporary-releases/user": {
      get: {
        tags: ["Temporary Releases"],
        summary: "Get current user's temporary releases",
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: "Returns list of releases made by user" },
        },
      },
    },
    "/api/temporary-releases/available/{computerId}": {
      get: {
        tags: ["Temporary Releases"],
        summary: "Get available released slots for booking on a computer",
        parameters: [{ name: "computerId", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          200: { description: "Returns array of dates with release detail records" },
        },
      },
    },
    "/api/temporary-releases/book": {
      post: {
        tags: ["Temporary Releases"],
        summary: "Book a temporarily released slot date",
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  computerId: { type: "string" },
                  date: { type: "string", format: "date" },
                  startTime: { type: "string", example: "09:00" },
                  endTime: { type: "string", example: "18:00" },
                  reason: { type: "string" },
                  problemStatement: { type: "string" },
                  datasetType: { type: "string" },
                  datasetSize: {
                    type: "object",
                    properties: {
                      value: { type: "number" },
                      unit: { type: "string" },
                    },
                  },
                  datasetLink: { type: "string" },
                  bottleneckExplanation: { type: "string" },
                },
                required: ["computerId", "date", "startTime", "endTime", "reason", "problemStatement", "datasetType", "datasetSize", "datasetLink", "bottleneckExplanation"],
              },
            },
          },
        },
        responses: {
          201: { description: "Temporary booking created" },
        },
      },
    },
    // Super Admin Routes
    "/api/superadmin/request-otp": {
      post: {
        tags: ["Super Admin"],
        summary: "Request OTP for superadmin login",
        description: "Initiates superadmin authentication flow by emailing a verification code.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "superadmin@example.com" },
                },
                required: ["email"],
              },
            },
          },
        },
        responses: {
          200: { description: "OTP sent successfully" },
          400: { description: "Invalid email" },
        },
      },
    },
    "/api/superadmin/verify-otp": {
      post: {
        tags: ["Super Admin"],
        summary: "Verify OTP and login",
        description: "Verifies the OTP sent to email and starts a session.",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string", example: "superadmin@example.com" },
                  otp: { type: "string", example: "123456" },
                },
                required: ["email", "otp"],
              },
            },
          },
        },
        responses: {
          200: { description: "Verification successful, session established" },
          401: { description: "Invalid or expired OTP" },
        },
      },
    },
    "/api/superadmin/logout": {
      post: {
        tags: ["Super Admin"],
        summary: "Logout superadmin",
        responses: {
          200: { description: "Logged out successfully" },
        },
      },
    },
    "/api/superadmin/me": {
      get: {
        tags: ["Super Admin"],
        summary: "Get current superadmin user info",
        responses: {
          200: { description: "Returns superadmin information" },
        },
      },
    },
  },
};

const swaggerSpec = swaggerJsdoc({
  swaggerDefinition,
  apis: ["./routes/*.js"],
});

// Setup function to attach routes
function setupSwagger(app) {
  // Expose raw swagger JSON
  app.get(["/api-docs.json", "/openapi.json"], (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Serve swagger UI
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss,
      customSiteTitle: "Negces Lab API Specs",
    })
  );

  console.log("Swagger UI documentation initialized at /api-docs");
}

module.exports = {
  setupSwagger,
};
