const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const { authenticate } = require('../middleware/auth');

// ==========================================
// Wallet Routes
// ==========================================

/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Get wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance info
 */
router.get('/balance', authenticate, mealController.getWalletBalance);

/**
 * @swagger
 * /wallet/topup:
 *   post:
 *     summary: Top up wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 10
 *                 maximum: 5000
 *               payment_method:
 *                 type: string
 *                 enum: [card, bank_transfer]
 */
router.post('/topup', authenticate, mealController.topUpWallet);

/**
 * @swagger
 * /wallet/topup/webhook:
 *   post:
 *     summary: Payment webhook callback
 *     tags: [Wallet]
 *     description: Callback endpoint for payment providers
 */
router.post('/topup/webhook', mealController.topUpWebhook);

/**
 * @swagger
 * /wallet/transactions:
 *   get:
 *     summary: Get transaction history
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [credit, debit]
 */
router.get('/transactions', authenticate, mealController.getTransactions);

module.exports = router;
