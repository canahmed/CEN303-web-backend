const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
    const MealReservation = sequelize.define('MealReservation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        },
        menu_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'meal_menus', key: 'id' }
        },
        cafeteria_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'cafeterias', key: 'id' }
        },
        meal_type: {
            type: DataTypes.ENUM('lunch', 'dinner'),
            allowNull: false
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        qr_code: {
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: false,
            defaultValue: () => `MR-${uuidv4().slice(0, 8).toUpperCase()}`
        },
        status: {
            type: DataTypes.ENUM('reserved', 'used', 'cancelled', 'expired'),
            defaultValue: 'reserved'
        },
        used_at: {
            type: DataTypes.DATE,
            allowNull: true
        }
    }, {
        tableName: 'meal_reservations',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['user_id', 'date'] },
            { fields: ['qr_code'], unique: true },
            { fields: ['status'] }
        ]
    });

    return MealReservation;
};
