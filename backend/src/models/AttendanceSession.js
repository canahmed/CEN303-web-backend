const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const AttendanceSession = sequelize.define('AttendanceSession', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    section_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'course_sections',
            key: 'id'
        },
        comment: 'Section ID'
    },
    instructor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Eğitmen ID'
    },
    date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Yoklama tarihi'
    },
    start_time: {
        type: DataTypes.TIME,
        allowNull: false,
        comment: 'Başlangıç saati'
    },
    end_time: {
        type: DataTypes.TIME,
        allowNull: true,
        comment: 'Bitiş saati'
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: false,
        validate: {
            min: -90,
            max: 90
        },
        comment: 'Sınıf GPS enlem'
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: false,
        validate: {
            min: -180,
            max: 180
        },
        comment: 'Sınıf GPS boylam'
    },
    geofence_radius: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 15,
        comment: 'Geofence yarıçapı (metre)'
    },
    qr_code: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        defaultValue: () => uuidv4(),
        comment: 'Benzersiz QR kod'
    },
    qr_expires_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'QR kod geçerlilik süresi'
    },
    status: {
        type: DataTypes.ENUM('active', 'closed', 'cancelled'),
        allowNull: false,
        defaultValue: 'active',
        comment: 'Oturum durumu'
    }
}, {
    tableName: 'attendance_sessions',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['section_id'] },
        { fields: ['instructor_id'] },
        { fields: ['date'] },
        { fields: ['status'] },
        { unique: true, fields: ['qr_code'] }
    ]
});

module.exports = AttendanceSession;
