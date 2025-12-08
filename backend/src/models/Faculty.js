const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Faculty = sequelize.define('faculty', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    employee_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    title: {
        type: DataTypes.STRING(100),
        allowNull: false // Prof. Dr., Doç. Dr., Dr. Öğr. Üyesi, etc.
    },
    department_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    office_location: {
        type: DataTypes.STRING(100),
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['user_id'] },
        { unique: true, fields: ['employee_number'] }
    ]
});

module.exports = Faculty;
