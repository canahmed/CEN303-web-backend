const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const { authenticate } = require('../middleware/auth');
const { isFaculty } = require('../middleware/authorize');
const { validateBody } = require('../middleware/validate');
const {
    createSessionSchema,
    checkInSchema,
    excuseSchema
} = require('../validations/attendanceValidation');
const multer = require('multer');
const path = require('path');

// Multer config for excuse documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/excuses'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'excuse-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const uploadExcuse = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|pdf/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Sadece JPEG, PNG ve PDF dosyaları yüklenebilir'));
    }
}).single('document');

// ============================================
// SESSION ROUTES (Faculty)
// ============================================

/**
 * @route POST /api/v1/attendance/sessions
 * @desc Create attendance session
 * @access Faculty only
 */
router.post('/sessions',
    authenticate,
    isFaculty,
    validateBody(createSessionSchema),
    attendanceController.createSession
);

/**
 * @route GET /api/v1/attendance/sessions/my-sessions
 * @desc Get my sessions
 * @access Faculty only
 */
router.get('/sessions/my-sessions',
    authenticate,
    isFaculty,
    attendanceController.getMySessions
);

/**
 * @route GET /api/v1/attendance/sessions/:id
 * @desc Get session details
 * @access Authenticated
 */
router.get('/sessions/:id',
    authenticate,
    attendanceController.getSession
);

/**
 * @route PUT /api/v1/attendance/sessions/:id/close
 * @desc Close session
 * @access Faculty only
 */
router.put('/sessions/:id/close',
    authenticate,
    isFaculty,
    attendanceController.closeSession
);

/**
 * @route POST /api/v1/attendance/sessions/:id/checkin
 * @desc Student check-in
 * @access Student only
 */
router.post('/sessions/:id/checkin',
    authenticate,
    validateBody(checkInSchema),
    attendanceController.checkIn
);

// ============================================
// ATTENDANCE REPORTS
// ============================================

/**
 * @route GET /api/v1/attendance/my-attendance
 * @desc Get my attendance stats
 * @access Student only
 */
router.get('/my-attendance',
    authenticate,
    attendanceController.getMyAttendance
);

/**
 * @route GET /api/v1/attendance/my-active-sessions
 * @desc Get active sessions for enrolled courses
 * @access Student only
 */
router.get('/my-active-sessions',
    authenticate,
    attendanceController.getMyActiveSessions
);

/**
 * @route GET /api/v1/attendance/report/:sectionId
 * @desc Get section attendance report
 * @access Faculty only
 */
router.get('/report/:sectionId',
    authenticate,
    isFaculty,
    attendanceController.getAttendanceReport
);

// ============================================
// EXCUSE ROUTES
// ============================================

/**
 * @route POST /api/v1/attendance/excuse-requests
 * @desc Submit excuse request
 * @access Student only
 */
router.post('/excuse-requests',
    authenticate,
    uploadExcuse,
    validateBody(excuseSchema),
    attendanceController.submitExcuse
);

/**
 * @route GET /api/v1/attendance/excuse-requests
 * @desc Get excuse requests
 * @access Faculty only
 */
router.get('/excuse-requests',
    authenticate,
    isFaculty,
    attendanceController.getExcuseRequests
);

/**
 * @route PUT /api/v1/attendance/excuse-requests/:id/approve
 * @desc Approve excuse
 * @access Faculty only
 */
router.put('/excuse-requests/:id/approve',
    authenticate,
    isFaculty,
    attendanceController.approveExcuse
);

/**
 * @route PUT /api/v1/attendance/excuse-requests/:id/reject
 * @desc Reject excuse
 * @access Faculty only
 */
router.put('/excuse-requests/:id/reject',
    authenticate,
    isFaculty,
    attendanceController.rejectExcuse
);

module.exports = router;
