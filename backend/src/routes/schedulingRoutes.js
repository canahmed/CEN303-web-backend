const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middleware/auth');

// ==========================================
// Schedule Routes
// ==========================================

/**
 * @swagger
 * /scheduling/generate:
 *   post:
 *     summary: Generate schedule using CSP algorithm (admin only)
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               semester:
 *                 type: string
 *                 enum: [Güz, Bahar]
 *               year:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Generated schedule
 */
router.post('/generate', authenticate, authorize('admin'), scheduleController.generateSchedule);

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

/**
 * @swagger
 * /scheduling/{scheduleId}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Scheduling]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: scheduleId
 *         required: true
 *         schema:
 *           type: string
 */
router.get('/:scheduleId', authenticate, scheduleController.getScheduleById);

module.exports = router;

