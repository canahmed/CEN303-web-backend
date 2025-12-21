const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middleware/auth');

// ==========================================
// Schedule Routes
// ==========================================

/**
 * @swagger
 * /scheduling/my-schedule:
 *   get:
 *     summary: Get my weekly schedule
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Weekly schedule data
 */
router.get('/my-schedule', authenticate, scheduleController.getMySchedule);

/**
 * @swagger
 * /scheduling/my-schedule/ical:
 *   get:
 *     summary: Download schedule as iCal file
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: iCal file download
 *         content:
 *           text/calendar:
 *             schema:
 *               type: string
 */
router.get('/my-schedule/ical', authenticate, scheduleController.getMyScheduleICal);

module.exports = router;
