const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Authentication middleware - verifies JWT token
 * Attaches user to request object if valid
 */
const authenticate = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('Access token gerekli');
        }

        const token = authHeader.split(' ')[1];

        if (!token) {
            throw ApiError.unauthorized('Access token gerekli');
        }

        // Verify token
        let decoded;
        try {
            decoded = verifyToken(token);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw ApiError.unauthorized('Token süresi dolmuş');
            }
            throw ApiError.unauthorized('Geçersiz token');
        }

        // Find user
        const user = await User.findByPk(decoded.id);

        if (!user) {
            throw ApiError.unauthorized('Kullanıcı bulunamadı');
        }

        if (!user.is_active) {
            throw ApiError.unauthorized('Hesap aktif değil. Lütfen email adresinizi doğrulayın');
        }

        // Attach user to request
        req.user = user;
        next();
    } catch (error) {
        next(error);
    }
};

/**
 * Optional authentication - continues even if no token
 * Useful for routes that have different behavior for authenticated users
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];

        try {
            const decoded = verifyToken(token);
            const user = await User.findByPk(decoded.id);
            if (user && user.is_active) {
                req.user = user;
            }
        } catch (error) {
            // Token invalid, continue without user
        }

        next();
    } catch (error) {
        next(error);
    }
};

module.exports = {
    authenticate,
    optionalAuth
};
