const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const AttendanceRecord = sequelize.define('AttendanceRecord', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    session_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'attendance_sessions',
            key: 'id'
        },
        comment: 'Yoklama oturumu ID'
    },
    student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'students',
            key: 'id'
        },
        comment: 'Öğrenci ID'
    },
    check_in_time: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Check-in zamanı'
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        validate: {
            min: -90,
            max: 90
        },
        comment: 'Öğrenci GPS enlem'
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        validate: {
            min: -180,
            max: 180
        },
        comment: 'Öğrenci GPS boylam'
    },
    distance_from_center: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Sınıf merkezinden uzaklık (metre)'
    },
    is_flagged: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Şüpheli yoklama flag'
    },
    flag_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Şüpheli yoklama nedeni'
    }
}, {
    tableName: 'attendance_records',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['session_id'] },
        { fields: ['student_id'] },
        { fields: ['is_flagged'] },
        { unique: true, fields: ['session_id', 'student_id'] }
    ]
});

module.exports = AttendanceRecord;
