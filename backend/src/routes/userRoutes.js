const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');
const { validateBody, validateQuery } = require('../middleware/validate');
const { uploadProfilePicture } = require('../middleware/upload');
const {
    updateProfileSchema,
    changePasswordSchema,
    userListQuerySchema
} = require('../validations/userValidation');

/**
 * @route   GET /api/v1/users/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
    '/me',
    authenticate,
    userController.getProfile
);

/**
 * @route   PUT /api/v1/users/me
 * @desc    Update current user profile
 * @access  Private
 */
router.put(
    '/me',
    authenticate,
    validateBody(updateProfileSchema),
    userController.updateProfile
);

/**
 * @route   POST /api/v1/users/me/profile-picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post(
    '/me/profile-picture',
    authenticate,
    uploadProfilePicture,
    userController.uploadProfilePicture
);

/**
 * @route   PUT /api/v1/users/me/password
 * @desc    Change password
 * @access  Private
 */
router.put(
    '/me/password',
    authenticate,
    validateBody(changePasswordSchema),
    userController.changePassword
);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin only)
 * @access  Private/Admin
 */
router.get(
    '/',
    authenticate,
    isAdmin,
    validateQuery(userListQuerySchema),
    userController.getUserList
);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get user by ID (admin only)
 * @access  Private/Admin
 */
router.get(
    '/:id',
    authenticate,
    isAdmin,
    userController.getUserById
);

module.exports = router;
