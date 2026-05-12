import swaggerJsdoc from 'swagger-jsdoc'

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RestaurantOS API',
      version: '1.0.0',
      description:
        'REST API for RestaurantOS — a full-featured bilingual (AR/EN) restaurant & café management system.\n\n' +
        'Features: POS system, kitchen display, menu management, table reservations, guest WiFi portal, ' +
        'employee management, reports & analytics, Stripe payments, and more.',
    },
    servers: [
      {
        url: '/api',
        description: 'API base path',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
      },
      schemas: {
        MenuItem: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid', description: 'Unique identifier' },
            name: { type: 'string', description: 'Item name' },
            nameAr: { type: 'string', description: 'Item name in Arabic' },
            description: { type: 'string', description: 'Item description' },
            descriptionAr: { type: 'string', description: 'Item description in Arabic' },
            price: { type: 'number', description: 'Item price' },
            category: { type: 'string', description: 'Category ID or name' },
            image: { type: 'string', description: 'Image URL' },
            available: { type: 'boolean', description: 'Whether item is available' },
            modifiers: {
              type: 'array',
              items: { $ref: '#/components/schemas/Modifier' },
              description: 'Item modifiers/options',
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Modifier: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            nameAr: { type: 'string' },
            options: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  nameAr: { type: 'string' },
                  price: { type: 'number' },
                },
              },
            },
          },
        },
        Order: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            orderNumber: { type: 'integer', description: 'Human-readable order number' },
            items: {
              type: 'array',
              items: { $ref: '#/components/schemas/OrderItem' },
            },
            tableId: { type: 'string', description: 'Table identifier (optional)' },
            type: {
              type: 'string',
              enum: ['dine-in', 'takeaway', 'delivery'],
              description: 'Order type',
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
            },
            total: { type: 'number', description: 'Order total' },
            customerName: { type: 'string' },
            customerPhone: { type: 'string' },
            notes: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        OrderItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            menuItemId: { type: 'string' },
            name: { type: 'string' },
            quantity: { type: 'integer', minimum: 1 },
            unitPrice: { type: 'number' },
            modifiers: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  price: { type: 'number' },
                },
              },
            },
            subtotal: { type: 'number' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: { type: 'string', enum: ['admin', 'staff', 'manager'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: { type: 'string', description: 'Error message' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { type: 'object' },
            },
            total: { type: 'integer' },
            page: { type: 'integer' },
            limit: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      '/auth/login': {
        post: {
          tags: ['Authentication'],
          summary: 'Login with credentials',
          description: 'Authenticate with email and password to receive JWT tokens',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string', format: 'email', example: 'admin@cafe.com' },
                    password: { type: 'string', format: 'password', example: 'admin123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login successful',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                      user: { $ref: '#/components/schemas/User' },
                    },
                  },
                },
              },
            },
            400: {
              description: 'Missing required fields',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
            401: {
              description: 'Invalid credentials',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/auth/refresh': {
        post: {
          tags: ['Authentication'],
          summary: 'Refresh access token',
          description: 'Use a valid refresh token (from cookie) to obtain a new access token',
          responses: {
            200: {
              description: 'Token refreshed successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      accessToken: { type: 'string' },
                    },
                  },
                },
              },
            },
            401: {
              description: 'Invalid or expired refresh token',
              content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorResponse' } } },
            },
          },
        },
      },
      '/auth/logout': {
        post: {
          tags: ['Authentication'],
          summary: 'Logout',
          description: 'Clear refresh token cookie and invalidate session',
          responses: {
            200: {
              description: 'Logged out successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string', example: 'Logged out' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/menu': {
        get: {
          tags: ['Menu'],
          summary: 'Get menu items',
          description: 'Retrieve menu items with optional filtering',
          parameters: [
            { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
            { name: 'available', in: 'query', schema: { type: 'boolean' }, description: 'Filter by availability' },
          ],
          responses: {
            200: {
              description: 'List of menu items',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/MenuItem' },
                  },
                },
              },
            },
          },
        },
        post: {
          tags: ['Menu'],
          summary: 'Create menu item',
          description: 'Add a new menu item (admin only)',
          security: [{ BearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    nameAr: { type: 'string' },
                    description: { type: 'string' },
                    descriptionAr: { type: 'string' },
                    price: { type: 'number' },
                    category: { type: 'string' },
                    image: { type: 'string' },
                    available: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Menu item created' },
            400: { description: 'Validation error' },
            403: { description: 'Forbidden — admin only' },
          },
        },
      },
      '/menu/{id}': {
        put: {
          tags: ['Menu'],
          summary: 'Update menu item',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    nameAr: { type: 'string' },
                    description: { type: 'string' },
                    price: { type: 'number' },
                    category: { type: 'string' },
                    available: { type: 'boolean' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Menu item updated' },
            404: { description: 'Menu item not found' },
          },
        },
        delete: {
          tags: ['Menu'],
          summary: 'Delete menu item (soft)',
          security: [{ BearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            204: { description: 'Menu item deleted' },
            404: { description: 'Menu item not found' },
          },
        },
      },
      '/orders': {
        get: {
          tags: ['Orders'],
          summary: 'Get orders',
          description: 'Retrieve paginated orders with optional status filter',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string' }, description: 'Filter by status' },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            200: {
              description: 'Paginated orders',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/PaginatedResponse' },
                },
              },
            },
          },
        },
        post: {
          tags: ['Orders'],
          summary: 'Create order',
          description: 'Place a new order (dine-in, takeaway, or delivery)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['items', 'type'],
                  properties: {
                    items: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          menuItemId: { type: 'string' },
                          quantity: { type: 'integer', minimum: 1 },
                          modifiers: { type: 'array', items: { type: 'object' } },
                        },
                      },
                    },
                    tableId: { type: 'string' },
                    type: { type: 'string', enum: ['dine-in', 'takeaway', 'delivery'] },
                    customerName: { type: 'string' },
                    customerPhone: { type: 'string' },
                    notes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Order created',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/Order' },
                },
              },
            },
          },
        },
      },
      '/orders/{id}/status': {
        patch: {
          tags: ['Orders'],
          summary: 'Update order status',
          description: 'Transition order to a new status (validates allowed transitions)',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['status'],
                  properties: {
                    status: {
                      type: 'string',
                      enum: ['pending', 'confirmed', 'preparing', 'ready', 'served', 'completed', 'cancelled'],
                    },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Status updated' },
            400: { description: 'Invalid status transition' },
            404: { description: 'Order not found' },
          },
        },
      },
    },
  },
  apis: [],
}

export const swaggerSpec = swaggerJsdoc(options)
