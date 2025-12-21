const { sequelize, testConnection } = require('../config/database');

// Part 1 Models
const User = require('./User');
const Department = require('./Department');
const Student = require('./Student');
const Faculty = require('./Faculty');

// Part 2 Models
const Course = require('./Course');
const CourseSection = require('./CourseSection');
const CoursePrerequisite = require('./CoursePrerequisite');
const Enrollment = require('./Enrollment');
const Classroom = require('./Classroom');
const AttendanceSession = require('./AttendanceSession');
const AttendanceRecord = require('./AttendanceRecord');
const ExcuseRequest = require('./ExcuseRequest');

// ==========================================
// Part 1 Associations
// ==========================================

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

// ==========================================
// Part 2 Associations
// ==========================================

// Department - Course (One-to-Many)
Department.hasMany(Course, {
    foreignKey: 'department_id',
    as: 'courses'
});
Course.belongsTo(Department, {
    foreignKey: 'department_id',
    as: 'department'
});

// Course - CourseSection (One-to-Many)
Course.hasMany(CourseSection, {
    foreignKey: 'course_id',
    as: 'sections'
});
CourseSection.belongsTo(Course, {
    foreignKey: 'course_id',
    as: 'course'
});

// User (Instructor) - CourseSection (One-to-Many)
User.hasMany(CourseSection, {
    foreignKey: 'instructor_id',
    as: 'teachingSections'
});
CourseSection.belongsTo(User, {
    foreignKey: 'instructor_id',
    as: 'instructor'
});

// Classroom - CourseSection (One-to-Many)
Classroom.hasMany(CourseSection, {
    foreignKey: 'classroom_id',
    as: 'sections'
});
CourseSection.belongsTo(Classroom, {
    foreignKey: 'classroom_id',
    as: 'classroom'
});

// Course Prerequisites (Self-referencing Many-to-Many)
Course.belongsToMany(Course, {
    through: CoursePrerequisite,
    as: 'prerequisites',
    foreignKey: 'course_id',
    otherKey: 'prerequisite_course_id'
});
Course.belongsToMany(Course, {
    through: CoursePrerequisite,
    as: 'requiredFor',
    foreignKey: 'prerequisite_course_id',
    otherKey: 'course_id'
});

// CoursePrerequisite direct associations (for prerequisiteService queries)
CoursePrerequisite.belongsTo(Course, {
    foreignKey: 'course_id',
    as: 'course'
});
CoursePrerequisite.belongsTo(Course, {
    foreignKey: 'prerequisite_course_id',
    as: 'prerequisite'
});

// Student - CourseSection (Many-to-Many via Enrollment)
Student.belongsToMany(CourseSection, {
    through: Enrollment,
    as: 'enrolledSections',
    foreignKey: 'student_id',
    otherKey: 'section_id'
});
CourseSection.belongsToMany(Student, {
    through: Enrollment,
    as: 'enrolledStudents',
    foreignKey: 'section_id',
    otherKey: 'student_id'
});

// Enrollment direct associations
Student.hasMany(Enrollment, {
    foreignKey: 'student_id',
    as: 'enrollments'
});
Enrollment.belongsTo(Student, {
    foreignKey: 'student_id',
    as: 'student'
});

CourseSection.hasMany(Enrollment, {
    foreignKey: 'section_id',
    as: 'enrollments'
});
Enrollment.belongsTo(CourseSection, {
    foreignKey: 'section_id',
    as: 'section'
});

// AttendanceSession associations
CourseSection.hasMany(AttendanceSession, {
    foreignKey: 'section_id',
    as: 'attendanceSessions'
});
AttendanceSession.belongsTo(CourseSection, {
    foreignKey: 'section_id',
    as: 'section'
});

User.hasMany(AttendanceSession, {
    foreignKey: 'instructor_id',
    as: 'conductedSessions'
});
AttendanceSession.belongsTo(User, {
    foreignKey: 'instructor_id',
    as: 'instructor'
});

// AttendanceRecord associations
AttendanceSession.hasMany(AttendanceRecord, {
    foreignKey: 'session_id',
    as: 'records'
});
AttendanceRecord.belongsTo(AttendanceSession, {
    foreignKey: 'session_id',
    as: 'session'
});

Student.hasMany(AttendanceRecord, {
    foreignKey: 'student_id',
    as: 'attendanceRecords'
});
AttendanceRecord.belongsTo(Student, {
    foreignKey: 'student_id',
    as: 'student'
});

// ExcuseRequest associations
Student.hasMany(ExcuseRequest, {
    foreignKey: 'student_id',
    as: 'excuseRequests'
});
ExcuseRequest.belongsTo(Student, {
    foreignKey: 'student_id',
    as: 'student'
});

AttendanceSession.hasMany(ExcuseRequest, {
    foreignKey: 'session_id',
    as: 'excuseRequests'
});
ExcuseRequest.belongsTo(AttendanceSession, {
    foreignKey: 'session_id',
    as: 'session'
});

User.hasMany(ExcuseRequest, {
    foreignKey: 'reviewed_by',
    as: 'reviewedExcuses'
});
ExcuseRequest.belongsTo(User, {
    foreignKey: 'reviewed_by',
    as: 'reviewer'
});

// ==========================================
// Database Sync
// ==========================================

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
    // Part 1 Models
    User,
    Department,
    Student,
    Faculty,
    // Part 2 Models
    Course,
    CourseSection,
    CoursePrerequisite,
    Enrollment,
    Classroom,
    AttendanceSession,
    AttendanceRecord,
    ExcuseRequest
};
