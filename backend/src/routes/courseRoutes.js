const express = require('express');
const router = express.Router();
const courseController = require('../controllers/courseController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');
const { validateBody, validateQuery } = require('../middleware/validate');
const {
    createCourseSchema,
    updateCourseSchema,
    courseQuerySchema
} = require('../validations/courseValidation');

/**
 * @route GET /api/v1/courses
 * @desc Get all courses with pagination and filtering
 * @access Public
 */
router.get('/', validateQuery(courseQuerySchema), courseController.getCourses);

/**
 * @route GET /api/v1/courses/:id
 * @desc Get course by ID with prerequisites
 * @access Public
 */
router.get('/:id', courseController.getCourseById);

/**
 * @route POST /api/v1/courses
 * @desc Create new course
 * @access Admin only
 */
router.post('/',
    authenticate,
    isAdmin,
    validateBody(createCourseSchema),
    courseController.createCourse
);

/**
 * @route PUT /api/v1/courses/:id
 * @desc Update course
 * @access Admin only
 */
router.put('/:id',
    authenticate,
    isAdmin,
    validateBody(updateCourseSchema),
    courseController.updateCourse
);

/**
 * @route DELETE /api/v1/courses/:id
 * @desc Delete course (soft delete)
 * @access Admin only
 */
router.delete('/:id',
    authenticate,
    isAdmin,
    courseController.deleteCourse
);

module.exports = router;
