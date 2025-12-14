const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Classroom = sequelize.define('Classroom', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    building: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Bina adı'
    },
    room_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: 'Oda numarası'
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        validate: {
            min: 1,
            max: 1000
        },
        comment: 'Kapasite'
    },
    features_json: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: 'Özellikler (projeksiyon, klima, vb.)'
    },
    latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        validate: {
            min: -90,
            max: 90
        },
        comment: 'GPS enlem koordinatı'
    },
    longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        validate: {
            min: -180,
            max: 180
        },
        comment: 'GPS boylam koordinatı'
    }
}, {
    tableName: 'classrooms',
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['building', 'room_number'] }
    ]
});

module.exports = Classroom;
