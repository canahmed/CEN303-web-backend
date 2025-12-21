const MealService = require('../services/mealService');
const WalletService = require('../services/walletService');
const ApiError = require('../utils/ApiError');

// ==========================================
// Cafeteria Controllers
// ==========================================

/**
 * GET /api/v1/meals/cafeterias
 * Get all active cafeterias
 */
const getCafeterias = async (req, res, next) => {
    try {
        const cafeterias = await MealService.getCafeterias();
        res.json({ success: true, data: cafeterias });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Menu Controllers
// ==========================================

/**
 * GET /api/v1/meals/menus
 * Get menus with optional filters
 */
const getMenus = async (req, res, next) => {
    try {
        const { start_date, end_date, cafeteria_id, meal_type } = req.query;
        const menus = await MealService.getMenus({
            startDate: start_date,
            endDate: end_date,
            cafeteriaId: cafeteria_id,
            mealType: meal_type
        });
        res.json({ success: true, data: menus });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/meals/menus/:id
 * Get menu by ID
 */
const getMenuById = async (req, res, next) => {
    try {
        const menu = await MealService.getMenuById(req.params.id);
        res.json({ success: true, data: menu });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/meals/menus
 * Create new menu (admin only)
 */
const createMenu = async (req, res, next) => {
    try {
        const menu = await MealService.createMenu(req.body);
        res.status(201).json({ success: true, data: menu });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/meals/menus/:id
 * Update menu (admin only)
 */
const updateMenu = async (req, res, next) => {
    try {
        const menu = await MealService.updateMenu(req.params.id, req.body);
        res.json({ success: true, data: menu });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/meals/menus/:id
 * Delete menu (admin only)
 */
const deleteMenu = async (req, res, next) => {
    try {
        await MealService.deleteMenu(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Reservation Controllers
// ==========================================

/**
 * POST /api/v1/meals/reservations
 * Create meal reservation
 */
const createReservation = async (req, res, next) => {
    try {
        const { menu_id } = req.body;
        if (!menu_id) throw ApiError.badRequest('Menü ID gerekli');

        const reservation = await MealService.createReservation(req.user.id, menu_id);
        res.status(201).json({
            success: true,
            message: 'Rezervasyon oluşturuldu',
            data: reservation
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/meals/reservations/:id
 * Cancel reservation
 */
const cancelReservation = async (req, res, next) => {
    try {
        await MealService.cancelReservation(req.params.id, req.user.id);
        res.json({ success: true, message: 'Rezervasyon iptal edildi' });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/meals/reservations/my
 * Get my reservations
 */
const getMyReservations = async (req, res, next) => {
    try {
        const { status, limit } = req.query;
        const reservations = await MealService.getMyReservations(req.user.id, {
            status,
            limit: limit ? parseInt(limit) : 20
        });
        res.json({ success: true, data: reservations });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/meals/reservations/:qrCode/use
 * Use meal by scanning QR code (cafeteria staff)
 */
const useMeal = async (req, res, next) => {
    try {
        const { qrCode } = req.params;
        const result = await MealService.useMeal(qrCode);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Wallet Controllers
// ==========================================

/**
 * GET /api/v1/wallet/balance
 * Get wallet balance
 */
const getWalletBalance = async (req, res, next) => {
    try {
        const balance = await WalletService.getBalance(req.user.id);
        res.json({ success: true, data: balance });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/wallet/topup
 * Top up wallet
 */
const topUpWallet = async (req, res, next) => {
    try {
        const { amount, payment_method } = req.body;
        if (!amount || amount <= 0) throw ApiError.badRequest('Geçerli bir tutar girin');

        const result = await WalletService.topUp(req.user.id, parseFloat(amount), payment_method);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/wallet/topup/webhook
 * Payment webhook callback
 */
const topUpWebhook = async (req, res, next) => {
    try {
        const { user_id, amount, payment_id, status } = req.body;
        const result = await WalletService.processWebhook({ userId: user_id, amount, paymentId: payment_id, status });
        res.json(result);
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/wallet/transactions
 * Get transaction history
 */
const getTransactions = async (req, res, next) => {
    try {
        const { page, limit, type } = req.query;
        const result = await WalletService.getTransactions(req.user.id, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            type
        });
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Cafeteria
    getCafeterias,
    // Menu
    getMenus,
    getMenuById,
    createMenu,
    updateMenu,
    deleteMenu,
    // Reservations
    createReservation,
    cancelReservation,
    getMyReservations,
    useMeal,
    // Wallet
    getWalletBalance,
    topUpWallet,
    topUpWebhook,
    getTransactions
};
