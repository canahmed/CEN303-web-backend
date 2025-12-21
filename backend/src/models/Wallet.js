const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Wallet = sequelize.define('Wallet', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' }
        },
        balance: {
            type: DataTypes.DECIMAL(12, 2),
            defaultValue: 0,
            validate: { min: 0 }
        },
        currency: {
            type: DataTypes.STRING(3),
            defaultValue: 'TRY'
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'wallets',
        timestamps: true,
        underscored: true
    });

    return Wallet;
};
