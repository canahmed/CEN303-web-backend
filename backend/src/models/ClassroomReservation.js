const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ClassroomReservation = sequelize.define('ClassroomReservation', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        classroom_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'classrooms', key: 'id' }
        },
        user_id: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' }
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        start_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        end_time: {
            type: DataTypes.TIME,
            allowNull: false
        },
        purpose: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
            defaultValue: 'pending'
        },
        approved_by: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' }
        },
        approved_at: {
            type: DataTypes.DATE,
            allowNull: true
        },
        rejection_reason: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    }, {
        tableName: 'classroom_reservations',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['classroom_id', 'date'] },
            { fields: ['user_id'] },
            { fields: ['status'] }
        ]
    });

    return ClassroomReservation;
};
