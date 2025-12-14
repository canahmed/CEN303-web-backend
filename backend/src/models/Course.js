const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Course = sequelize.define('Course', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Ders kodu (örn: CSE101)'
    },
    name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Ders adı'
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Ders açıklaması'
    },
    credits: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 3,
        validate: {
            min: 1,
            max: 10
        },
        comment: 'Kredi sayısı'
    },
    ects: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
            min: 1,
            max: 30
        },
        comment: 'ECTS kredisi'
    },
    syllabus_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'Ders izlencesi URL'
    },
    department_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        },
        comment: 'Bölüm ID'
    },
    is_deleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Soft delete flag'
    }
}, {
    tableName: 'courses',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
        { fields: ['department_id'] },
        { fields: ['is_deleted'] }
    ]
});

module.exports = Course;
