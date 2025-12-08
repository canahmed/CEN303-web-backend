const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Department = sequelize.define('departments', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    faculty: {
        type: DataTypes.STRING(255),
        allowNull: false
    }
}, {
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['code'] }
    ]
});

module.exports = Department;
