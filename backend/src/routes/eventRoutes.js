const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

// ==========================================
// Event Routes
// ==========================================

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Get events with filters
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [conference, workshop, seminar, social, sports, career, other]
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 */
router.get('/', authenticate, eventController.getEvents);

/**
 * @swagger
 * /events/my-registrations:
 *   get:
 *     summary: Get my event registrations
 *     tags: [Events]
 */
router.get('/my-registrations', authenticate, eventController.getMyRegistrations);

/**
 * @swagger
 * /events/checkin/{qrCode}:
 *   post:
 *     summary: Check-in with QR code
 *     tags: [Events]
 */
router.post('/checkin/:qrCode', authenticate, authorize('admin', 'faculty'), eventController.checkInByQR);

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 */
router.get('/:id', authenticate, eventController.getEventById);

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create event (admin only)
 *     tags: [Events]
 */
router.post('/', authenticate, authorize('admin'), eventController.createEvent);

/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update event (admin only)
 *     tags: [Events]
 */
router.put('/:id', authenticate, authorize('admin'), eventController.updateEvent);

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete event (admin only)
 *     tags: [Events]
 */
router.delete('/:id', authenticate, authorize('admin'), eventController.deleteEvent);

// ==========================================
// Registration Routes
// ==========================================

/**
 * @swagger
 * /events/{id}/register:
 *   post:
 *     summary: Register for event
 *     tags: [Events]
 */
router.post('/:id/register', authenticate, eventController.register);

/**
 * @swagger
 * /events/{id}/registrations:
 *   get:
 *     summary: Get event registrations (admin/organizer)
 *     tags: [Events]
 */
router.get('/:id/registrations', authenticate, authorize('admin', 'faculty'), eventController.getEventRegistrations);

/**
 * @swagger
 * /events/{eventId}/registrations/{regId}:
 *   delete:
 *     summary: Cancel registration
 *     tags: [Events]
 */
router.delete('/:eventId/registrations/:regId', authenticate, eventController.cancelRegistration);

/**
 * @swagger
 * /events/{eventId}/registrations/{regId}/checkin:
 *   post:
 *     summary: Check-in registration
 *     tags: [Events]
 */
router.post('/:eventId/registrations/:regId/checkin', authenticate, authorize('admin', 'faculty'), eventController.checkIn);

module.exports = router;
