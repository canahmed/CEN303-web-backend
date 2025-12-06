const ApiError = require('../utils/ApiError');
const config = require('../config');

/**
 * Global error handling middleware
 * Catches all errors and returns consistent JSON response
 */
const errorHandler = (err, req, res, next) => {
    let error = err;

    // Log error in development
    if (config.nodeEnv === 'development') {
        console.error('Error:', err);
    }

    // Handle Sequelize validation errors
    if (err.name === 'SequelizeValidationError') {
        const messages = err.errors.map(e => e.message).join(', ');
        error = ApiError.badRequest(messages);
    }

    // Handle Sequelize unique constraint errors
    if (err.name === 'SequelizeUniqueConstraintError') {
        const field = err.errors[0]?.path || 'alan';
        error = ApiError.conflict(`Bu ${field} zaten kullanılıyor`);
    }

    // Handle Sequelize foreign key constraint errors
    if (err.name === 'SequelizeForeignKeyConstraintError') {
        error = ApiError.badRequest('Geçersiz referans');
    }

    // Handle JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = ApiError.unauthorized('Geçersiz token');
    }

    if (err.name === 'TokenExpiredError') {
        error = ApiError.unauthorized('Token süresi dolmuş');
    }

    // Handle Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error = ApiError.badRequest('Dosya boyutu çok büyük');
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error = ApiError.badRequest('Beklenmeyen dosya alanı');
    }

    // Ensure error has required properties
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Sunucu hatası';
    const status = error.status || 'error';

    // Send response
    res.status(statusCode).json({
        success: false,
        error: {
            code: statusCode === 500 ? 'INTERNAL_ERROR' : err.code || 'ERROR',
            message,
            ...(config.nodeEnv === 'development' && { stack: err.stack })
        }
    });
};

/**
 * 404 Not Found handler
 */
const notFound = (req, res, next) => {
    next(ApiError.notFound(`${req.originalUrl} bulunamadı`));
};

module.exports = {
    errorHandler,
    notFound
};
