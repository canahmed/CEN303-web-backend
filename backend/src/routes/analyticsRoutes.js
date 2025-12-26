const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticate, authorize } = require('../middleware/auth');

// ==========================================
// Analytics Routes (Admin Only)
// ==========================================

/**
 * @swagger
 * /analytics/dashboard:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get('/dashboard', authenticate, authorize('admin'), analyticsController.getDashboard);

/**
 * @swagger
 * /analytics/academic-performance:
 *   get:
 *     summary: Get academic performance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Academic performance data
 */
router.get('/academic-performance', authenticate, authorize('admin'), analyticsController.getAcademicPerformance);

/**
 * @swagger
 * /analytics/attendance:
 *   get:
 *     summary: Get attendance analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Attendance analytics data
 */
router.get('/attendance', authenticate, authorize('admin'), analyticsController.getAttendance);

/**
 * @swagger
 * /analytics/meal-usage:
 *   get:
 *     summary: Get meal usage analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Meal usage data
 */
router.get('/meal-usage', authenticate, authorize('admin'), analyticsController.getMealUsage);

/**
 * @swagger
 * /analytics/events:
 *   get:
 *     summary: Get event analytics
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Event analytics data
 */
router.get('/events', authenticate, authorize('admin'), analyticsController.getEvents);

/**
 * @swagger
 * /analytics/export/{type}:
 *   get:
 *     summary: Export report
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [academic, attendance, meal, event]
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv, excel, pdf]
 *           default: csv
 *     responses:
 *       200:
 *         description: Exported report
 */
router.get('/export/:type', authenticate, authorize('admin'), analyticsController.exportReport);

module.exports = router;
