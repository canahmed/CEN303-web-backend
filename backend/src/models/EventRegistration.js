const { DataTypes } = require('sequelize');
const { v4: uuidv4 } = require('uuid');

module.exports = (sequelize) => {
    const EventRegistration = sequelize.define('EventRegistration', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        event_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'events', key: 'id' }
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        },
        registration_date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        qr_code: {
            type: DataTypes.STRING(100),
            unique: true,
            allowNull: false,
            defaultValue: () => `ER-${uuidv4().slice(0, 8).toUpperCase()}`
        },
        checked_in: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        checked_in_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        custom_fields_json: {
            type: DataTypes.JSONB,
            defaultValue: {},
            comment: 'Custom registration form data'
        },
        status: {
            type: DataTypes.ENUM('registered', 'cancelled', 'waitlist'),
            defaultValue: 'registered'
        }
    }, {
        tableName: 'event_registrations',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['event_id', 'user_id'], unique: true },
            { fields: ['qr_code'], unique: true },
            { fields: ['status'] }
        ]
    });

    return EventRegistration;
};
