import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Wed API Documentation",
      version: "1.0.0",
      description:
        "API documentation for Wed app - Authentication and User Management",
      contact: {
        name: "Wed API Support",
      },
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:3000",
        description: "Development server",
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
            id: {
              type: "string",
              description: "User ID",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
            },
            name: {
              type: "string",
              description: "User full name",
            },
            relationshipType: {
              type: "string",
              enum: ["husband", "wife"],
              description: "Relationship type",
            },
            dateOfBirth: {
              type: "string",
              format: "date",
              description: "User date of birth",
            },
            numberOfChildren: {
              type: "number",
              description: "Number of children",
            },
            isEmailConfirmed: {
              type: "boolean",
              description: "Whether email is confirmed",
            },
            isProfileComplete: {
              type: "boolean",
              description: "Whether profile is complete",
            },
            role: {
              type: "string",
              enum: ["user", "admin", "superAdmin"],
              description: "User role",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "User creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "User last update date",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              minLength: 8,
              example: "SecurePass123",
            },
          },
        },
        ConfirmOTPRequest: {
          type: "object",
          required: ["email", "otp"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            otp: {
              type: "string",
              pattern: "^[0-9]{4}$",
              example: "1234",
            },
          },
        },
        ResendOTPRequest: {
          type: "object",
          required: ["email"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "user@example.com",
            },
            password: {
              type: "string",
              example: "SecurePass123",
            },
          },
        },
        UpdateProfileRequest: {
          type: "object",
          required: ["name", "dateOfBirth"],
          properties: {
            name: {
              type: "string",
              example: "John Doe",
            },
            relationshipType: {
              type: "string",
              enum: ["husband", "wife"],
              example: "husband",
            },
            dateOfBirth: {
              type: "string",
              format: "date",
              example: "1990-01-01",
            },
            numberOfChildren: {
              type: "number",
              example: 2,
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            message: {
              type: "string",
              example: "User registered successfully. OTP sent to email.",
            },
            data: {
              type: "object",
              properties: {
                token: {
                  type: "string",
                  description: "JWT authentication token",
                },
                user: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
        },
        UserResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "success",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/User",
                },
              },
            },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            status: {
              type: "string",
              example: "error",
            },
            message: {
              type: "string",
              example: "Error message description",
            },
          },
        },
        Question: {
          type: "object",
          properties: {
            _id: {
              type: "string",
              description: "Question ID (MongoDB ObjectId)",
            },
            title_en: {
              type: "string",
              description: "Question title in English",
            },
            title_ar: {
              type: "string",
              description: "Question title in Arabic",
            },
            type: {
              type: "string",
              enum: ["personal", "partner", "common"],
              description: "Question type",
            },
            options: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title_en: {
                    type: "string",
                    description: "Option title in English",
                  },
                  title_ar: {
                    type: "string",
                    description: "Option title in Arabic",
                  },
                },
              },
              description: "Question options",
            },
            isActive: {
              type: "boolean",
              description: "Whether the question is active",
            },
            createdAt: {
              type: "string",
              format: "date-time",
              description: "Question creation date",
            },
            updatedAt: {
              type: "string",
              format: "date-time",
              description: "Question last update date",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Authentication",
        description: "User authentication and registration endpoints",
      },
      {
        name: "Users",
        description: "User management endpoints (admin only)",
      },
      {
        name: "Questions",
        description: "Question management endpoints (admin only)",
      },
    ],
  },
  apis: ["./src/routes/*.ts", "./src/controllers/*.ts"],
};

export const swaggerSpec = swaggerJsdoc(options);
