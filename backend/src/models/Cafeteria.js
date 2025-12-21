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
