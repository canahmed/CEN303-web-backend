const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const config = require('./config');
const routes = require('./routes');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { testConnection, syncDatabase } = require('./models');
const { autoSeed } = require('./utils/autoSeed');

// Create Express app
const app = express();

const allowedOrigins = config.frontendUrls || [config.frontendUrl];
const isOriginAllowed = (origin) => !origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin);

const corsOptions = {
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

// Swagger API Documentation
app.use(
    '/swagger',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Smart Campus API - Swagger Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
            docExpansion: 'list',
            filter: true,
            showExtensions: true,
            showCommonExtensions: true,
        },
    }),
);

// Swagger JSON endpoint
app.get('/swagger.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.send(swaggerSpec);
});

// Security middleware (Swagger UI için CSP ayarları düzenlendi)
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: 'cross-origin' },
        contentSecurityPolicy: false, // Swagger UI için devre dışı
    }),
);

// CORS configuration
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: 'Çok fazla istek gönderildi. Lütfen daha sonra tekrar deneyin.',
        },
    },
});
// app.use('/api/', limiter); // Rate limiter devre dışı - lokal test için

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Static files (uploads)
app.use(
    '/uploads',
    cors({
        ...corsOptions,
        origin: (origin, callback) => {
            if (isOriginAllowed(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
    }),
    (req, res, next) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    },
    express.static(path.join(__dirname, '..', 'uploads')),
);

// API routes
app.use('/api/v1', routes);

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Smart Campus API Server',
        version: '1.0.0',
        documentation: '/swagger',
        endpoints: {
            swagger: '/swagger',
            swaggerJson: '/swagger.json',
            health: '/api/v1/health',
            auth: '/api/v1/auth',
            users: '/api/v1/users',
            departments: '/api/v1/departments',
        },
    });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
    try {
        await testConnection();

        if (config.nodeEnv === 'development') {
            await syncDatabase({ alter: true });
        } else {
            await syncDatabase({ alter: false });
        }

        await autoSeed();

        const PORT = config.port;
        app.listen(PORT, () => {
            console.log(`
===============================
 Smart Campus API Server
-------------------------------
 URL: http://localhost:${PORT}
 Environment: ${config.nodeEnv}
 Database: ${config.database.name}
 API Docs: http://localhost:${PORT}/swagger
===============================
            `);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Start the server
startServer();

module.exports = app;
