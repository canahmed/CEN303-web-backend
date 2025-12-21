const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Event = sequelize.define('Event', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        title: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        category: {
            type: DataTypes.ENUM('conference', 'workshop', 'seminar', 'social', 'sports', 'career', 'other'),
            defaultValue: 'other'
        },
        organizer_id: {
            type: DataTypes.UUID,
            allowNull: true,
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
        location: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        capacity: {
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        registered_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        registration_deadline: {
            type: DataTypes.DATE,
            allowNull: true
        },
        is_paid: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0
        },
        image_url: {
            type: DataTypes.STRING(500),
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('draft', 'published', 'cancelled', 'completed'),
            defaultValue: 'draft'
        }
    }, {
        tableName: 'events',
        timestamps: true,
        underscored: true,
        indexes: [
            { fields: ['date'] },
            { fields: ['category'] },
            { fields: ['status'] }
        ]
    });

    return Event;
};
