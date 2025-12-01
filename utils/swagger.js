const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Smart City API",
      version: "1.0.0",
      description: "API Documentation for Smart City project - Comprehensive backend API for smart city management system",
    },
    servers: [
      {
        url: "http://localhost:4000/api",
        description: "Development server",
      },
      {
        url: "https://45.138.158.158/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64a1b2c3d4e5f6789abcdef" },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            role: { type: "string", enum: ["super_admin", "admin", "sector_admin", "user"], example: "admin" },
            sector: { type: "string", enum: ["ecology", "security", "infrastructure", "health", "education", "social", "economic", "other"], example: "ecology" },
            isActive: { type: "boolean", example: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@example.com" },
            password: { type: "string", format: "password", example: "password123" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            message: { type: "string", example: "Login successful" },
            data: {
              type: "object",
              properties: {
                user: { $ref: "#/components/schemas/User" },
                token: { type: "string", example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." },
                refreshToken: { type: "string" },
              },
            },
          },
        },
        Appeal: {
          type: "object",
          properties: {
            _id: { type: "string", example: "64a1b2c3d4e5f6789abcdef" },
            firstName: { type: "string", example: "John" },
            lastName: { type: "string", example: "Doe" },
            email: { type: "string", format: "email", example: "john.doe@example.com" },
            phone: { type: "string", example: "+998901234567" },
            title: { type: "string", example: "Street lighting issue" },
            message: { type: "string", example: "The street lights on Main Street are not working properly" },
            type: { type: "string", enum: ["complaint", "suggestion", "question", "request", "appreciation", "other"], example: "complaint" },
            sector: { type: "string", enum: ["infrastructure", "environment", "ecology", "transport", "health", "education", "social", "economic", "other"], example: "infrastructure" },
            priority: { type: "string", enum: ["low", "medium", "high", "urgent"], example: "medium" },
            status: { type: "string", enum: ["open", "in_progress", "waiting_response", "closed", "rejected"], example: "open" },
            location: {
              type: "object",
              properties: {
                district: { type: "string", example: "Chilanzar" },
                address: { type: "string", example: "Main Street 123" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Error message" },
            error: { type: "string", example: "Detailed error information" },
          },
        },
        PaginationResponse: {
          type: "object",
          properties: {
            data: { type: "array" },
            pagination: {
              type: "object",
              properties: {
                currentPage: { type: "integer", example: 1 },
                totalPages: { type: "integer", example: 5 },
                totalItems: { type: "integer", example: 100 },
                itemsPerPage: { type: "integer", example: 20 },
                hasNextPage: { type: "boolean", example: true },
                hasPrevPage: { type: "boolean", example: false },
              },
            },
          },
        },
      },
    },
    tags: [
      { name: "Authentication", description: "User authentication and authorization" },
      { name: "Admin", description: "Admin operations and user management" },
      { name: "Users", description: "User management operations" },
      { name: "Environment", description: "Environmental monitoring data" },
      { name: "Traffic", description: "Traffic management data" },
      { name: "Transport", description: "Public transport data" },
      { name: "Appeals", description: "Citizen appeals and complaints management" },
    ],
  },
  apis: [
    "./routes/*.js",           // All route files
    "./routes/sectors/*.js",   // Sector-specific routes
    "./controller/*.js",       // Controllers for additional context
  ],
};

const specs = swaggerJsdoc(options);

module.exports = (app) => {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Smart City API Documentation',
  }));
};
