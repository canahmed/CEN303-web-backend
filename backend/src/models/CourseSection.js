const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const CourseSection = sequelize.define('CourseSection', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    course_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'courses',
            key: 'id'
        },
        comment: 'Ders ID'
    },
    section_number: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: '01',
        comment: 'Section numarası (örn: 01, 02)'
    },
    semester: {
        type: DataTypes.ENUM('fall', 'spring', 'summer'),
        allowNull: false,
        comment: 'Dönem'
    },
    year: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Akademik yıl'
    },
    instructor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        comment: 'Eğitmen (User ID)'
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 30,
        validate: {
            min: 1,
            max: 500
        },
        comment: 'Maksimum öğrenci sayısı'
    },
    enrolled_count: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0
        },
        comment: 'Kayıtlı öğrenci sayısı'
    },
    schedule_json: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: 'Ders programı JSON formatında',
        defaultValue: []
    },
    classroom_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'classrooms',
            key: 'id'
        },
        comment: 'Varsayılan sınıf ID'
    }
}, {
    tableName: 'course_sections',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['course_id'] },
        { fields: ['instructor_id'] },
        { fields: ['semester', 'year'] },
        { unique: true, fields: ['course_id', 'section_number', 'semester', 'year'] }
    ]
});

module.exports = CourseSection;
