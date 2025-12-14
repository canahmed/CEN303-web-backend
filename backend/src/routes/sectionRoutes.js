const express = require('express');
const router = express.Router();
const sectionController = require('../controllers/sectionController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');
const { validateBody, validateQuery } = require('../middleware/validate');
const {
    createSectionSchema,
    updateSectionSchema,
    sectionQuerySchema
} = require('../validations/courseValidation');

/**
 * @route GET /api/v1/sections
 * @desc Get all sections with filtering
 * @access Public
 */
router.get('/', validateQuery(sectionQuerySchema), sectionController.getSections);

/**
 * @route GET /api/v1/sections/:id
 * @desc Get section by ID
 * @access Public
 */
router.get('/:id', sectionController.getSectionById);

/**
 * @route POST /api/v1/sections
 * @desc Create new section
 * @access Admin only
 */
router.post('/',
    authenticate,
    isAdmin,
    validateBody(createSectionSchema),
    sectionController.createSection
);

/**
 * @route PUT /api/v1/sections/:id
 * @desc Update section
 * @access Admin only
 */
router.put('/:id',
    authenticate,
    isAdmin,
    validateBody(updateSectionSchema),
    sectionController.updateSection
);

module.exports = router;
