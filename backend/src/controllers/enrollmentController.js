const { Student, Enrollment, CourseSection } = require('../models');
const EnrollmentService = require('../services/enrollmentService');
const ScheduleConflictService = require('../services/scheduleConflictService');
const ApiError = require('../utils/ApiError');
const { sequelize } = require('../models');
const { Op, Sequelize } = require('sequelize');

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

        const enrollment = await EnrollmentService.dropCourse(id, student.id);

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
        const sectionKey = String(req.params.sectionId || '').trim();

        // Basic UUID guard to avoid DB errors
        if (!sectionKey || !Sequelize.Validator.isUUID(sectionKey)) {
            throw ApiError.badRequest('Geçersiz şube ID');
        }

        const students = await EnrollmentService.getSectionStudents(sectionKey);

        res.json({
            success: true,
            data: students.map((enrollment) => ({
                enrollmentId: enrollment.id,
                studentId: enrollment.student_id,
                studentNumber: enrollment.student?.student_number,
                name: `${enrollment.student?.user?.first_name || ''} ${enrollment.student?.user?.last_name || ''}`.trim(),
                email: enrollment.student?.user?.email,
                status: enrollment.status,
            }))
        });
    } catch (error) {
        if (error?.message?.includes('uuid') && error?.message?.includes('integer')) {
            return next(ApiError.badRequest('Geçersiz şube ID'));
        }
        next(error);
    }
};

/**
 * Add a student to a section (Faculty/Admin)
 */
const addStudentToSection = async (req, res, next) => {
    try {
        const { sectionId } = req.params;
        const { student_id } = req.body;

        const student = await Student.findByPk(student_id);
        if (!student) {
            throw ApiError.notFound('Öğrenci bulunamadı');
        }

        const enrollment = await EnrollmentService.enrollStudent(student.id, sectionId);

        res.status(201).json({
            success: true,
            message: 'Öğrenci şubeye eklendi',
            data: {
                enrollmentId: enrollment.id,
                studentId: enrollment.student_id,
                studentNumber: student.student_number,
                name: `${student.first_name || ''} ${student.last_name || ''}`.trim(),
                email: student.user?.email,
                status: enrollment.status,
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Remove a student from a section (Faculty/Admin)
 */
const removeStudentFromSection = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { sectionId, studentId } = req.params;

        const enrollment = await Enrollment.findOne({
            where: { section_id: sectionId, student_id: studentId },
            transaction
        });

        if (!enrollment) {
            throw ApiError.notFound('Kayıt bulunamadı');
        }

        if (enrollment.status === 'enrolled') {
            await CourseSection.update(
                { enrolled_count: sequelize.literal('enrolled_count - 1') },
                { where: { id: sectionId }, transaction }
            );
        }

        await enrollment.destroy({ transaction });
        await transaction.commit();

        res.json({
            success: true,
            message: 'Öğrenci şubeden çıkarıldı'
        });
    } catch (error) {
        await transaction.rollback();
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
    getMySchedule,
    addStudentToSection,
    removeStudentFromSection
};
