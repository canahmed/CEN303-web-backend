const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Enrollment = sequelize.define('Enrollment', {
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
    section_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'course_sections',
            key: 'id'
        },
        comment: 'Section ID'
    },
    status: {
        type: DataTypes.ENUM('enrolled', 'dropped', 'completed', 'failed', 'withdrawn'),
        allowNull: false,
        defaultValue: 'enrolled',
        comment: 'Kayıt durumu'
    },
    enrollment_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'Kayıt tarihi'
    },
    drop_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: 'Ders bırakma tarihi'
    },
    midterm_grade: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        },
        comment: 'Vize notu (0-100)'
    },
    final_grade: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 100
        },
        comment: 'Final notu (0-100)'
    },
    letter_grade: {
        type: DataTypes.STRING(2),
        allowNull: true,
        validate: {
            isIn: [['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF', 'NA', 'I', 'W']]
        },
        comment: 'Harf notu'
    },
    grade_point: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        validate: {
            min: 0,
            max: 4
        },
        comment: 'Grade point (0.00-4.00)'
    }
}, {
    tableName: 'enrollments',
    timestamps: true,
    underscored: true,
    indexes: [
        { fields: ['student_id'] },
        { fields: ['section_id'] },
        { fields: ['status'] },
        { unique: true, fields: ['student_id', 'section_id'] }
    ]
});

module.exports = Enrollment;
