const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middleware/auth');

// ==========================================
// Classroom Reservation Routes
// ==========================================

/**
 * @swagger
 * /reservations:
 *   post:
 *     summary: Create classroom reservation
 *     tags: [Reservations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - classroom_id
 *               - date
 *               - start_time
 *               - end_time
 *               - purpose
 *             properties:
 *               classroom_id:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               start_time:
 *                 type: string
 *                 format: time
 *               end_time:
 *                 type: string
 *                 format: time
 *               purpose:
 *                 type: string
 */
router.post('/', authenticate, scheduleController.createReservation);

/**
 * @swagger
 * /reservations:
 *   get:
 *     summary: Get reservations (admin sees all, users see own)
 *     tags: [Reservations]
 */
router.get('/', authenticate, scheduleController.getReservations);

/**
 * @swagger
 * /reservations/my:
 *   get:
 *     summary: Get my reservations
 *     tags: [Reservations]
 */
router.get('/my', authenticate, scheduleController.getMyReservations);

/**
 * @swagger
 * /reservations/{id}/approve:
 *   put:
 *     summary: Approve reservation (admin only)
 *     tags: [Reservations]
 */
router.put('/:id/approve', authenticate, authorize('admin'), scheduleController.approveReservation);

/**
 * @swagger
 * /reservations/{id}/reject:
 *   put:
 *     summary: Reject reservation (admin only)
 *     tags: [Reservations]
 */
router.put('/:id/reject', authenticate, authorize('admin'), scheduleController.rejectReservation);

/**
 * @swagger
 * /reservations/{id}:
 *   delete:
 *     summary: Cancel reservation
 *     tags: [Reservations]
 */
router.delete('/:id', authenticate, scheduleController.cancelReservation);

module.exports = router;
