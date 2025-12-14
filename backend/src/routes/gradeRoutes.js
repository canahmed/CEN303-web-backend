const express = require('express');
const router = express.Router();
const gradeController = require('../controllers/gradeController');
const { authenticate } = require('../middleware/auth');
const { isFaculty } = require('../middleware/authorize');
const { validateBody } = require('../middleware/validate');
const { gradeEntrySchema, bulkGradeEntrySchema } = require('../validations/gradeValidation');

/**
 * @route GET /api/v1/grades/my-grades
 * @desc Get my grades
 * @access Student only
 */
router.get('/my-grades',
    authenticate,
    gradeController.getMyGrades
);

/**
 * @route GET /api/v1/grades/transcript
 * @desc Get transcript JSON
 * @access Student only
 */
router.get('/transcript',
    authenticate,
    gradeController.getTranscript
);

/**
 * @route GET /api/v1/grades/transcript/pdf
 * @desc Get transcript as PDF/HTML
 * @access Student only
 */
router.get('/transcript/pdf',
    authenticate,
    gradeController.getTranscriptPdf
);

/**
 * @route POST /api/v1/grades
 * @desc Enter grades for a student
 * @access Faculty only
 */
router.post('/',
    authenticate,
    isFaculty,
    validateBody(gradeEntrySchema),
    gradeController.enterGrades
);

/**
 * @route POST /api/v1/grades/bulk
 * @desc Bulk enter grades
 * @access Faculty only
 */
router.post('/bulk',
    authenticate,
    isFaculty,
    validateBody(bulkGradeEntrySchema),
    gradeController.bulkEnterGrades
);

module.exports = router;
