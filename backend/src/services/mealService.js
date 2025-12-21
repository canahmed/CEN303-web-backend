const {
    MealMenu,
    MealReservation,
    Cafeteria,
    Wallet,
    Transaction,
    User
} = require('../models');
const { Op, Sequelize } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');

class MealService {
    /**
     * Get all cafeterias
     */
    static async getCafeterias() {
        return Cafeteria.findAll({
            where: { is_active: true },
            order: [['name', 'ASC']]
        });
    }

    /**
     * Get menus by date range
     */
    static async getMenus({ startDate, endDate, cafeteriaId, mealType }) {
        const where = { is_published: true };

        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            where.date = { [Op.gte]: startDate };
        }

        if (cafeteriaId) where.cafeteria_id = cafeteriaId;
        if (mealType) where.meal_type = mealType;

        return MealMenu.findAll({
            where,
            include: [{ model: Cafeteria, as: 'cafeteria' }],
            order: [['date', 'ASC'], ['meal_type', 'ASC']]
        });
    }

    /**
     * Get menu by ID
     */
    static async getMenuById(id) {
        const menu = await MealMenu.findByPk(id, {
            include: [{ model: Cafeteria, as: 'cafeteria' }]
        });
        if (!menu) throw ApiError.notFound('Menü bulunamadı');
        return menu;
    }

    /**
     * Create a new menu (admin only)
     */
    static async createMenu(data) {
        return MealMenu.create(data);
    }

    /**
     * Update menu
     */
    static async updateMenu(id, data) {
        const menu = await MealMenu.findByPk(id);
        if (!menu) throw ApiError.notFound('Menü bulunamadı');
        return menu.update(data);
    }

    /**
     * Delete menu
     */
    static async deleteMenu(id) {
        const menu = await MealMenu.findByPk(id);
        if (!menu) throw ApiError.notFound('Menü bulunamadı');
        await menu.destroy();
        return { message: 'Menü silindi' };
    }

    /**
     * Create meal reservation
     */
    static async createReservation(userId, menuId) {
        const menu = await MealMenu.findByPk(menuId, {
            include: [{ model: Cafeteria, as: 'cafeteria' }]
        });
        if (!menu) throw ApiError.notFound('Menü bulunamadı');
        if (!menu.is_published) throw ApiError.badRequest('Menü henüz yayınlanmadı');

        // Check if already reserved
        const existing = await MealReservation.findOne({
            where: {
                user_id: userId,
                menu_id: menuId,
                status: 'reserved'
            }
        });
        if (existing) throw ApiError.conflict('Bu menü için zaten rezervasyonunuz var');

        // Check daily limit (max 2 meals per day)
        const dailyCount = await MealReservation.count({
            where: {
                user_id: userId,
                date: menu.date,
                status: { [Op.in]: ['reserved', 'used'] }
            }
        });
        if (dailyCount >= 2) throw ApiError.badRequest('Günlük yemek limitine ulaştınız (max 2)');

        // Get/create wallet and check balance
        let wallet = await Wallet.findOne({ where: { user_id: userId } });
        if (!wallet) {
            wallet = await Wallet.create({ user_id: userId, balance: 0 });
        }

        const price = parseFloat(menu.price) || 0;
        if (price > 0 && parseFloat(wallet.balance) < price) {
            throw ApiError.badRequest('Yetersiz bakiye');
        }

        // Generate QR code
        const qrCode = `MR-${uuidv4().slice(0, 8).toUpperCase()}`;

        // Create reservation
        const reservation = await MealReservation.create({
            user_id: userId,
            menu_id: menuId,
            cafeteria_id: menu.cafeteria_id,
            meal_type: menu.meal_type,
            date: menu.date,
            amount: price,
            qr_code: qrCode,
            status: 'reserved'
        });

        return reservation;
    }

    /**
     * Cancel reservation
     */
    static async cancelReservation(reservationId, userId) {
        const reservation = await MealReservation.findByPk(reservationId);
        if (!reservation) throw ApiError.notFound('Rezervasyon bulunamadı');
        if (reservation.user_id !== userId) throw ApiError.forbidden('Bu rezervasyon size ait değil');
        if (reservation.status !== 'reserved') throw ApiError.badRequest('Bu rezervasyon iptal edilemez');

        // Check if at least 2 hours before meal time
        const now = new Date();
        const mealDate = new Date(reservation.date);
        const hoursUntilMeal = (mealDate - now) / (1000 * 60 * 60);
        if (hoursUntilMeal < 2) {
            throw ApiError.badRequest('Yemekten 2 saatten az kaldı, iptal edilemez');
        }

        await reservation.update({ status: 'cancelled' });
        return { message: 'Rezervasyon iptal edildi' };
    }

    /**
     * Get user's reservations
     */
    static async getMyReservations(userId, { status, limit = 20 } = {}) {
        const where = { user_id: userId };
        if (status) where.status = status;

        return MealReservation.findAll({
            where,
            include: [
                { model: MealMenu, as: 'menu' },
                { model: Cafeteria, as: 'cafeteria' }
            ],
            order: [['date', 'DESC'], ['created_at', 'DESC']],
            limit
        });
    }

    /**
     * Use meal (scan QR) - Cafeteria staff
     */
    static async useMeal(qrCode) {
        const reservation = await MealReservation.findOne({
            where: { qr_code: qrCode },
            include: [
                { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
                { model: MealMenu, as: 'menu' },
                { model: Cafeteria, as: 'cafeteria' }
            ]
        });

        if (!reservation) throw ApiError.notFound('Geçersiz QR kod');
        if (reservation.status === 'used') throw ApiError.badRequest('Bu yemek zaten kullanıldı');
        if (reservation.status === 'cancelled') throw ApiError.badRequest('Bu rezervasyon iptal edilmiş');
        if (reservation.status === 'expired') throw ApiError.badRequest('Bu rezervasyon süresi dolmuş');

        // Check if correct date
        const today = new Date().toISOString().slice(0, 10);
        if (reservation.date !== today) {
            throw ApiError.badRequest('Bu rezervasyon bugün için geçerli değil');
        }

        // Deduct from wallet if paid meal
        const amount = parseFloat(reservation.amount) || 0;
        if (amount > 0) {
            const wallet = await Wallet.findOne({ where: { user_id: reservation.user_id } });
            if (!wallet) throw ApiError.badRequest('Cüzdan bulunamadı');

            const newBalance = parseFloat(wallet.balance) - amount;
            if (newBalance < 0) throw ApiError.badRequest('Yetersiz bakiye');

            await wallet.update({ balance: newBalance });
            await Transaction.create({
                wallet_id: wallet.id,
                type: 'debit',
                amount: amount,
                balance_after: newBalance,
                reference_type: 'meal_reservation',
                reference_id: reservation.id,
                description: `Yemek: ${reservation.menu?.meal_type === 'lunch' ? 'Öğle' : 'Akşam'}`
            });
        }

        await reservation.update({ status: 'used', used_at: new Date() });

        return {
            message: 'Yemek kullanıldı',
            user: reservation.user,
            meal_type: reservation.meal_type,
            cafeteria: reservation.cafeteria?.name
        };
    }
}

module.exports = MealService;
