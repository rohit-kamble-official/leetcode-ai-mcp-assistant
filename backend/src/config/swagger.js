/**
 * src/config/swagger.js
 *
 * WHY: Swagger/OpenAPI documentation makes the API self-describing.
 *      Developers can explore and test endpoints without reading source code.
 * HOW: swagger-jsdoc reads JSDoc comments from route files and generates
 *      an OpenAPI spec. swagger-ui-express serves an interactive UI.
 */

import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LeetCode AI MCP Assistant API',
      version: '1.0.0',
      description:
        'A production-ready API for interacting with LeetCode problems using AI-powered tools, MCP protocol, and real-time WebSockets.',
      contact: {
        name: 'API Support',
        email: 'support@leetcode-mcp.dev',
      },
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 3000}/api/v1`,
        description: 'Development Server',
      },
    ],
    components: {
      securitySchemes: {
        // JWT Bearer token — set in Authorization header as: Bearer <token>
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  // Scan all route files for JSDoc @swagger comments
  apis: ['./src/routes/*.js', './src/controllers/*.js'],
};

export const swaggerSpec = swaggerJsdoc(options);
