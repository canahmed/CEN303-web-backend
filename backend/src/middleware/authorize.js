const ApiError = require('../utils/ApiError');

/**
 * Role-based authorization middleware
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized('Yetkilendirme için giriş yapmalısınız'));
        }

        if (!roles.includes(req.user.role)) {
            return next(ApiError.forbidden('Bu işlem için yetkiniz yok'));
        }

        next();
    };
};

/**
 * Check if user is admin
 */
const isAdmin = authorize('admin');

/**
 * Check if user is faculty
 */
const isFaculty = authorize('faculty', 'admin');

/**
 * Check if user is student
 */
const isStudent = authorize('student', 'admin');

/**
 * Check if user is faculty or admin
 */
const isFacultyOrAdmin = authorize('faculty', 'admin');

/**
 * Check if user is accessing their own resource
 * @param {string} paramName - Request parameter name containing user ID
 */
const isOwnerOrAdmin = (paramName = 'id') => {
    return (req, res, next) => {
        if (!req.user) {
            return next(ApiError.unauthorized('Yetkilendirme için giriş yapmalısınız'));
        }

        const resourceId = req.params[paramName];

        if (req.user.role === 'admin' || req.user.id === resourceId) {
            return next();
        }

        return next(ApiError.forbidden('Bu kaynağa erişim yetkiniz yok'));
    };
};

module.exports = {
    authorize,
    isAdmin,
    isFaculty,
    isStudent,
    isFacultyOrAdmin,
    isOwnerOrAdmin
};
