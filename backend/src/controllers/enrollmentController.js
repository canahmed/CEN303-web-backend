const { Student } = require('../models');
const EnrollmentService = require('../services/enrollmentService');
const ScheduleConflictService = require('../services/scheduleConflictService');
const ApiError = require('../utils/ApiError');

/**
 * Enroll in a course section
 */
const enrollInSection = async (req, res, next) => {
    try {
        const { section_id } = req.body;
        const userId = req.user.id;

        // Get student record
        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler derse kayıt olabilir');
        }

        const enrollment = await EnrollmentService.enrollStudent(student.id, section_id);

        res.status(201).json({
            success: true,
            message: 'Derse başarıyla kayıt oldunuz',
            data: enrollment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Drop a course
 */
const dropCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler ders bırakabilir');
        }

        const enrollment = await EnrollmentService.dropCourse(parseInt(id), student.id);

        res.json({
            success: true,
            message: 'Ders başarıyla bırakıldı',
            data: enrollment
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my enrolled courses
 */
const getMyCourses = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { semester, year, status } = req.query;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler bu endpoint\'i kullanabilir');
        }

        const enrollments = await EnrollmentService.getStudentCourses(student.id, {
            semester,
            year: year ? parseInt(year) : undefined,
            status
        });

        res.json({
            success: true,
            data: enrollments
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get students enrolled in a section (Faculty only)
 */
const getSectionStudents = async (req, res, next) => {
    try {
        const { sectionId } = req.params;

        const students = await EnrollmentService.getSectionStudents(parseInt(sectionId));

        res.json({
            success: true,
            data: students
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get student's weekly schedule
 */
const getMySchedule = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { semester = 'fall', year = new Date().getFullYear() } = req.query;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler bu endpoint\'i kullanabilir');
        }

        const schedule = await ScheduleConflictService.getStudentSchedule(
            student.id,
            semester,
            parseInt(year)
        );

        res.json({
            success: true,
            data: schedule
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    enrollInSection,
    dropCourse,
    getMyCourses,
    getSectionStudents,
    getMySchedule
};
