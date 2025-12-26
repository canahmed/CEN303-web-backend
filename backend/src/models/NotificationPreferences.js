const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NotificationPreferences = sequelize.define('NotificationPreferences', {
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
        }
    },
    email_preferences: {
        type: DataTypes.JSONB,
        defaultValue: {
            academic: true,
            attendance: true,
            meal: true,
            event: true,
            payment: true,
            system: true
        }
    },
    push_preferences: {
        type: DataTypes.JSONB,
        defaultValue: {
            academic: true,
            attendance: true,
            meal: true,
            event: true,
            payment: true,
            system: false
        }
    },
    sms_preferences: {
        type: DataTypes.JSONB,
        defaultValue: {
            attendance: false,
            payment: false
        }
    }
}, {
    tableName: 'notification_preferences',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['user_id'], unique: true }
    ]
});

module.exports = NotificationPreferences;
