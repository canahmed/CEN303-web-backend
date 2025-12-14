const express = require('express');
const router = express.Router();
const enrollmentController = require('../controllers/enrollmentController');
const { authenticate } = require('../middleware/auth');
const { isFaculty } = require('../middleware/authorize');
const { validateBody, validateQuery } = require('../middleware/validate');
const { enrollSchema, enrollmentQuerySchema } = require('../validations/enrollmentValidation');

/**
 * @route POST /api/v1/enrollments
 * @desc Enroll in a course section
 * @access Student only
 */
router.post('/',
    authenticate,
    validateBody(enrollSchema),
    enrollmentController.enrollInSection
);

/**
 * @route DELETE /api/v1/enrollments/:id
 * @desc Drop a course
 * @access Student only
 */
router.delete('/:id',
    authenticate,
    enrollmentController.dropCourse
);

/**
 * @route GET /api/v1/enrollments/my-courses
 * @desc Get my enrolled courses
 * @access Student only
 */
router.get('/my-courses',
    authenticate,
    validateQuery(enrollmentQuerySchema),
    enrollmentController.getMyCourses
);

/**
 * @route GET /api/v1/enrollments/my-schedule
 * @desc Get my weekly schedule
 * @access Student only
 */
router.get('/my-schedule',
    authenticate,
    enrollmentController.getMySchedule
);

/**
 * @route GET /api/v1/enrollments/students/:sectionId
 * @desc Get students in a section
 * @access Faculty only
 */
router.get('/students/:sectionId',
    authenticate,
    isFaculty,
    enrollmentController.getSectionStudents
);

module.exports = router;
