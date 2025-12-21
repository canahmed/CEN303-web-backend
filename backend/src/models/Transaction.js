const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Transaction = sequelize.define('Transaction', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        wallet_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'wallets', key: 'id' }
        },
        type: {
            type: DataTypes.ENUM('credit', 'debit'),
            allowNull: false,
            comment: 'credit = para yükleme, debit = harcama'
        },
        amount: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },
        balance_after: {
            type: DataTypes.DECIMAL(12, 2),
            allowNull: false
        },
        reference_type: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'meal_reservation, event_registration, topup, refund'
        },
        reference_id: {
            type: DataTypes.UUID,
            allowNull: true
        },
        description: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        payment_method: {
            type: DataTypes.STRING(50),
            allowNull: true,
            comment: 'card, bank_transfer, cash'
        }
    }, {
        tableName: 'transactions',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['wallet_id'] },
            { fields: ['type'] },
            { fields: ['reference_type', 'reference_id'] }
        ]
    });

    return Transaction;
};
