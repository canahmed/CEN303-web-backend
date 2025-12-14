const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

/**
 * @route GET /api/v1/dashboard
 * @desc Role-based dashboard summary
 * @access Authenticated
 */
router.get('/',
    authenticate,
    dashboardController.getDashboard
);

module.exports = router;
