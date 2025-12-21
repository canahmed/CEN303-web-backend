const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { authenticate, authorize } = require('../middleware/auth');

// ==========================================
// Cafeteria Routes
// ==========================================

/**
 * @swagger
 * /meals/cafeterias:
 *   get:
 *     summary: Get all active cafeterias
 *     tags: [Meals]
 *     responses:
 *       200:
 *         description: List of cafeterias
 */
router.get('/cafeterias', authenticate, mealController.getCafeterias);

// ==========================================
// Menu Routes
// ==========================================

/**
 * @swagger
 * /meals/menus:
 *   get:
 *     summary: Get menus with optional filters
 *     tags: [Meals]
 *     parameters:
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
 *       - in: query
 *         name: cafeteria_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: meal_type
 *         schema:
 *           type: string
 *           enum: [lunch, dinner]
 */
router.get('/menus', authenticate, mealController.getMenus);

/**
 * @swagger
 * /meals/menus/{id}:
 *   get:
 *     summary: Get menu by ID
 *     tags: [Meals]
 */
router.get('/menus/:id', authenticate, mealController.getMenuById);

/**
 * @swagger
 * /meals/menus:
 *   post:
 *     summary: Create new menu (admin only)
 *     tags: [Meals]
 */
router.post('/menus', authenticate, authorize('admin'), mealController.createMenu);

/**
 * @swagger
 * /meals/menus/{id}:
 *   put:
 *     summary: Update menu (admin only)
 *     tags: [Meals]
 */
router.put('/menus/:id', authenticate, authorize('admin'), mealController.updateMenu);

/**
 * @swagger
 * /meals/menus/{id}:
 *   delete:
 *     summary: Delete menu (admin only)
 *     tags: [Meals]
 */
router.delete('/menus/:id', authenticate, authorize('admin'), mealController.deleteMenu);

// ==========================================
// Reservation Routes
// ==========================================

/**
 * @swagger
 * /meals/reservations:
 *   post:
 *     summary: Create meal reservation
 *     tags: [Meals]
 */
router.post('/reservations', authenticate, mealController.createReservation);

/**
 * @swagger
 * /meals/reservations/my:
 *   get:
 *     summary: Get my reservations
 *     tags: [Meals]
 */
router.get('/reservations/my', authenticate, mealController.getMyReservations);

/**
 * @swagger
 * /meals/reservations/{id}:
 *   delete:
 *     summary: Cancel reservation
 *     tags: [Meals]
 */
router.delete('/reservations/:id', authenticate, mealController.cancelReservation);

/**
 * @swagger
 * /meals/reservations/{qrCode}/use:
 *   post:
 *     summary: Use meal by QR code (cafeteria staff)
 *     tags: [Meals]
 */
router.post('/reservations/:qrCode/use', authenticate, authorize('admin', 'staff'), mealController.useMeal);

module.exports = router;
