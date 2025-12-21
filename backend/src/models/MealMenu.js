const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const MealMenu = sequelize.define('MealMenu', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        cafeteria_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'cafeterias', key: 'id' }
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        meal_type: {
            type: DataTypes.ENUM('lunch', 'dinner'),
            allowNull: false
        },
        items_json: {
            type: DataTypes.JSONB,
            defaultValue: [],
            comment: 'Array of menu items: [{name, description, allergens}]'
        },
        nutrition_json: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: '{calories, protein, carbs, fat, fiber}'
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        is_published: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        }
    }, {
        tableName: 'meal_menus',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['cafeteria_id', 'date', 'meal_type'], unique: true },
            { fields: ['date'] }
        ]
    });

    return MealMenu;
};
