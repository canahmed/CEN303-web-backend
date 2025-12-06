const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const ApiError = require('../utils/ApiError');

// Allowed file types for profile pictures
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif'];

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.path);
    },
    filename: (req, file, cb) => {
        // Generate unique filename
        const ext = path.extname(file.originalname).toLowerCase();
        const filename = `${uuidv4()}${ext}`;
        cb(null, filename);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(ApiError.badRequest('Sadece JPEG, PNG ve GIF dosyaları kabul edilir'), false);
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return cb(ApiError.badRequest('Geçersiz dosya uzantısı'), false);
    }

    cb(null, true);
};

// Multer upload instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: config.upload.maxFileSize // 5MB default
    }
});

/**
 * Profile picture upload middleware
 * Single file, field name: 'profilePicture'
 */
const uploadProfilePicture = upload.single('profilePicture');

/**
 * Document upload middleware
 * Single file, field name: 'document'
 */
const uploadDocument = upload.single('document');

/**
 * Multiple files upload middleware
 * @param {string} fieldName - Form field name
 * @param {number} maxCount - Maximum number of files
 */
const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);

module.exports = {
    upload,
    uploadProfilePicture,
    uploadDocument,
    uploadMultiple
};
