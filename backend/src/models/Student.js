const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Student = sequelize.define('students', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
        references: {
            model: 'users',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    student_number: {
        type: DataTypes.STRING(20),
        allowNull: false,
        unique: true
    },
    department_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'departments',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
    },
    enrollment_year: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    gpa: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.00
    },
    cgpa: {
        type: DataTypes.DECIMAL(3, 2),
        allowNull: true,
        defaultValue: 0.00
    }
}, {
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['user_id'] },
        { unique: true, fields: ['student_number'] }
    ]
});

module.exports = Student;
