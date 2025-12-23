const express = require('express');
const router = express.Router();
const classroomController = require('../controllers/classroomController');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorize');

/**
 * @route GET /api/v1/classrooms
 * @desc  List classrooms for dropdowns
 * @access Authenticated users
 */
router.get(
    '/',
    authenticate,
    classroomController.getClassrooms
);

module.exports = router;
