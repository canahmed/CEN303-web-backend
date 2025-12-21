const {
    Wallet,
    Transaction,
    User
} = require('../models');
const ApiError = require('../utils/ApiError');

class WalletService {
    /**
     * Get or create wallet for user
     */
    static async getOrCreateWallet(userId) {
        let wallet = await Wallet.findOne({
            where: { user_id: userId },
            include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }]
        });

        if (!wallet) {
            wallet = await Wallet.create({ user_id: userId, balance: 0 });
            wallet = await Wallet.findByPk(wallet.id, {
                include: [{ model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }]
            });
        }

        return wallet;
    }

    /**
     * Get wallet balance
     */
    static async getBalance(userId) {
        const wallet = await this.getOrCreateWallet(userId);
        return {
            balance: parseFloat(wallet.balance),
            currency: wallet.currency,
            is_active: wallet.is_active
        };
    }

    /**
     * Top up wallet
     */
    static async topUp(userId, amount, paymentMethod = 'card') {
        if (amount < 10) throw ApiError.badRequest('Minimum yükleme tutarı 10 TRY');
        if (amount > 5000) throw ApiError.badRequest('Maximum yükleme tutarı 5000 TRY');

        const wallet = await this.getOrCreateWallet(userId);
        const newBalance = parseFloat(wallet.balance) + amount;

        await wallet.update({ balance: newBalance });

        const transaction = await Transaction.create({
            wallet_id: wallet.id,
            type: 'credit',
            amount: amount,
            balance_after: newBalance,
            reference_type: 'topup',
            description: 'Bakiye yükleme',
            payment_method: paymentMethod
        });

        return {
            message: 'Bakiye yüklendi',
            new_balance: newBalance,
            transaction_id: transaction.id
        };
    }

    /**
     * Get transaction history
     */
    static async getTransactions(userId, { page = 1, limit = 20, type } = {}) {
        const wallet = await Wallet.findOne({ where: { user_id: userId } });
        if (!wallet) return { transactions: [], total: 0, page, limit };

        const where = { wallet_id: wallet.id };
        if (type) where.type = type;

        const { rows, count } = await Transaction.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit,
            offset: (page - 1) * limit
        });

        return {
            transactions: rows,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        };
    }

    /**
     * Process payment webhook (for third-party payment providers)
     */
    static async processWebhook({ userId, amount, paymentId, status }) {
        if (status !== 'success') {
            return { success: false, message: 'Payment failed' };
        }

        const result = await this.topUp(userId, amount, 'webhook');
        return { success: true, ...result, payment_id: paymentId };
    }

    /**
     * Add debit transaction (internal use)
     */
    static async debit(userId, amount, referenceType, referenceId, description) {
        const wallet = await Wallet.findOne({ where: { user_id: userId } });
        if (!wallet) throw ApiError.badRequest('Cüzdan bulunamadı');

        const currentBalance = parseFloat(wallet.balance);
        if (currentBalance < amount) throw ApiError.badRequest('Yetersiz bakiye');

        const newBalance = currentBalance - amount;
        await wallet.update({ balance: newBalance });

        await Transaction.create({
            wallet_id: wallet.id,
            type: 'debit',
            amount,
            balance_after: newBalance,
            reference_type: referenceType,
            reference_id: referenceId,
            description
        });

        return { new_balance: newBalance };
    }

    /**
     * Refund to wallet
     */
    static async refund(userId, amount, referenceType, referenceId, description) {
        const wallet = await this.getOrCreateWallet(userId);
        const newBalance = parseFloat(wallet.balance) + amount;

        await wallet.update({ balance: newBalance });

        await Transaction.create({
            wallet_id: wallet.id,
            type: 'credit',
            amount,
            balance_after: newBalance,
            reference_type: 'refund',
            reference_id: referenceId,
            description: description || 'İade'
        });

        return { new_balance: newBalance };
    }
}

module.exports = WalletService;
