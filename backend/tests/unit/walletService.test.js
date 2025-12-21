/**
 * Unit Tests: Wallet Service
 * Tests for wallet balance, topup, and transaction operations
 */

const WalletService = require('../../src/services/walletService');
const { Wallet, Transaction, User } = require('../../src/models');

// Mock the models
jest.mock('../../src/models', () => ({
    Wallet: {
        findOne: jest.fn(),
        findByPk: jest.fn(),
        create: jest.fn()
    },
    Transaction: {
        findAndCountAll: jest.fn(),
        create: jest.fn()
    },
    User: {}
}));

describe('WalletService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getOrCreateWallet', () => {
        it('should return existing wallet', async () => {
            const mockWallet = {
                id: 'wallet-123',
                user_id: 'user-123',
                balance: 100,
                currency: 'TRY',
                is_active: true
            };
            Wallet.findOne.mockResolvedValue(mockWallet);

            const result = await WalletService.getOrCreateWallet('user-123');

            expect(Wallet.findOne).toHaveBeenCalledWith(expect.objectContaining({
                where: { user_id: 'user-123' }
            }));
            expect(result).toEqual(mockWallet);
        });

        it('should create wallet if not exists', async () => {
            Wallet.findOne.mockResolvedValueOnce(null);
            const mockNewWallet = {
                id: 'wallet-new',
                user_id: 'user-123',
                balance: 0
            };
            Wallet.create.mockResolvedValue(mockNewWallet);
            Wallet.findByPk.mockResolvedValue(mockNewWallet);

            const result = await WalletService.getOrCreateWallet('user-123');

            expect(Wallet.create).toHaveBeenCalledWith({ user_id: 'user-123', balance: 0 });
        });
    });

    describe('getBalance', () => {
        it('should return wallet balance', async () => {
            const mockWallet = {
                id: 'wallet-123',
                balance: 250.50,
                currency: 'TRY',
                is_active: true
            };
            Wallet.findOne.mockResolvedValue(mockWallet);

            const result = await WalletService.getBalance('user-123');

            expect(result.balance).toBe(250.50);
            expect(result.currency).toBe('TRY');
        });
    });

    describe('topUp', () => {
        it('should add money to wallet', async () => {
            const mockWallet = {
                id: 'wallet-123',
                balance: 100,
                update: jest.fn().mockResolvedValue(true)
            };
            Wallet.findOne.mockResolvedValue(mockWallet);
            Transaction.create.mockResolvedValue({ id: 'tx-123' });

            const result = await WalletService.topUp('user-123', 50, 'card');

            expect(mockWallet.update).toHaveBeenCalledWith({ balance: 150 });
            expect(result.new_balance).toBe(150);
        });

        it('should reject amounts below minimum (10 TRY)', async () => {
            await expect(WalletService.topUp('user-123', 5, 'card'))
                .rejects.toThrow('Minimum yükleme tutarı 10 TRY');
        });

        it('should reject amounts above maximum (5000 TRY)', async () => {
            await expect(WalletService.topUp('user-123', 6000, 'card'))
                .rejects.toThrow('Maximum yükleme tutarı 5000 TRY');
        });
    });

    describe('getTransactions', () => {
        it('should return paginated transactions', async () => {
            const mockWallet = { id: 'wallet-123' };
            Wallet.findOne.mockResolvedValue(mockWallet);

            const mockTransactions = [
                { id: 'tx-1', type: 'credit', amount: 100 },
                { id: 'tx-2', type: 'debit', amount: 25 }
            ];
            Transaction.findAndCountAll.mockResolvedValue({
                rows: mockTransactions,
                count: 2
            });

            const result = await WalletService.getTransactions('user-123', { page: 1, limit: 10 });

            expect(result.transactions).toHaveLength(2);
            expect(result.total).toBe(2);
        });

        it('should filter by transaction type', async () => {
            const mockWallet = { id: 'wallet-123' };
            Wallet.findOne.mockResolvedValue(mockWallet);
            Transaction.findAndCountAll.mockResolvedValue({ rows: [], count: 0 });

            await WalletService.getTransactions('user-123', { type: 'credit' });

            expect(Transaction.findAndCountAll).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ type: 'credit' })
                })
            );
        });
    });
});
