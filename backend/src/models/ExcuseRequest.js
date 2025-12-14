const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ExcuseRequest = sequelize.define('ExcuseRequest', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
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
    session_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'attendance_sessions',
            key: 'id'
        },
        comment: 'Yoklama oturumu ID'
    },
    reason: {
        type: DataTypes.TEXT,
        allowNull: false,
        comment: 'Mazeret açıklaması'
    },
    document_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Mazeret belgesi URL'
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'Mazeret durumu'
    },
    reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'İnceleyen kullanıcı ID'
    },
    reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: 'İnceleme tarihi'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'İnceleme notları'
    }
}, {
    tableName: 'excuse_requests',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['student_id'] },
        { fields: ['session_id'] },
        { fields: ['status'] },
        { fields: ['reviewed_by'] }
    ]
});

module.exports = ExcuseRequest;
