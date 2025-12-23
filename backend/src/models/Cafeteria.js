const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Cafeteria = sequelize.define('Cafeteria', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        location: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        open_hours: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'Örn: Öğle: 11:30-14:00, Akşam: 17:30-20:00'
        },
        capacity: {
            type: DataTypes.INTEGER,
            defaultValue: 100
        },
        is_active: {
            type: DataTypes.BOOLEAN,
            defaultValue: true
        }
    }, {
        tableName: 'cafeterias',
        timestamps: true,
        underscored: true
    });

    return Cafeteria;
};
