const { sequelize, testConnection } = require('../config/database');
const User = require('./User');
const Department = require('./Department');
const Student = require('./Student');
const Faculty = require('./Faculty');

// Define Associations

// User - Student (One-to-One)
User.hasOne(Student, {
    foreignKey: 'user_id',
    as: 'student'
});
Student.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// User - Faculty (One-to-One)
User.hasOne(Faculty, {
    foreignKey: 'user_id',
    as: 'faculty'
});
Faculty.belongsTo(User, {
    foreignKey: 'user_id',
    as: 'user'
});

// Department - Student (One-to-Many)
Department.hasMany(Student, {
    foreignKey: 'department_id',
    as: 'students'
});
Student.belongsTo(Department, {
    foreignKey: 'department_id',
    as: 'department'
});

// Department - Faculty (One-to-Many)
Department.hasMany(Faculty, {
    foreignKey: 'department_id',
    as: 'facultyMembers'
});
Faculty.belongsTo(Department, {
    foreignKey: 'department_id',
    as: 'department'
});

// Sync database (create tables if not exist)
const syncDatabase = async (options = {}) => {
    try {
        await sequelize.sync(options);
        console.log('✅ Database synchronized successfully.');
    } catch (error) {
        console.error('❌ Database synchronization failed:', error.message);
        throw error;
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase,
    User,
    Department,
    Student,
    Faculty
};
