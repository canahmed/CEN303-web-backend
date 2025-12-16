const { Enrollment, CourseSection, Course, Student, sequelize } = require('../models');
const PrerequisiteService = require('./prerequisiteService');
const ScheduleConflictService = require('./scheduleConflictService');
const ApiError = require('../utils/ApiError');

/**
 * EnrollmentService - Orchestrates enrollment process
 */
class EnrollmentService {
    // Drop period: 4 weeks from semester start
    static DROP_PERIOD_WEEKS = 4;

    /**
     * Enroll a student in a course section
     * @param {string} studentId - Student ID
     * @param {string} sectionId - Section ID
     * @returns {Promise<Enrollment>} - Created enrollment
     */
    static async enrollStudent(studentId, sectionId) {
        const transaction = await sequelize.transaction();

        try {
            // 1. Get section details
        const section = await CourseSection.findByPk(String(sectionId), {
            include: [{ model: Course, as: 'course' }],
            transaction
        });

            if (!section) {
                throw ApiError.notFound('Section bulunamadı');
            }

            // 2. Check if already enrolled
        const existingEnrollment = await Enrollment.findOne({
            where: {
                student_id: studentId,
                section_id: String(sectionId)
            },
            transaction
        });

            if (existingEnrollment) {
                if (existingEnrollment.status === 'enrolled') {
                    throw ApiError.conflict('Bu derse zaten kayıtlısınız');
                }
                if (existingEnrollment.status === 'completed') {
                    throw ApiError.conflict('Bu dersi zaten tamamladınız');
                }
            }

            // 3. Check prerequisites
            const prereqResult = await PrerequisiteService.checkPrerequisites(
                section.course_id,
                studentId
            );

            if (!prereqResult.met) {
                const missingCodes = prereqResult.missing.map(p => p.code).join(', ');
                throw ApiError.badRequest(`Önkoşul dersleri tamamlanmamış: ${missingCodes}`);
            }

            // 4. Check schedule conflicts
            const conflictResult = await ScheduleConflictService.checkConflict(
                studentId,
                section
            );

            if (conflictResult.hasConflict) {
                const conflictInfo = conflictResult.conflicts.map(c =>
                    `${c.courseCode} (${c.conflictDay} ${c.existingTime})`
                ).join(', ');
                throw ApiError.conflict(`Ders programı çakışması: ${conflictInfo}`);
            }

            // 5. Check capacity (atomic update)
            const [affectedRows] = await CourseSection.update(
                { enrolled_count: sequelize.literal('enrolled_count + 1') },
                {
                    where: {
                        id: String(sectionId),
                        enrolled_count: { [require('sequelize').Op.lt]: sequelize.col('capacity') }
                    },
                    transaction
                }
            );

            if (affectedRows === 0) {
                throw ApiError.conflict('Bu section dolu');
            }

            // 6. Create enrollment
            const enrollment = await Enrollment.create({
                student_id: studentId,
                section_id: String(sectionId),
                status: 'enrolled',
                enrollment_date: new Date()
            }, { transaction });

            await transaction.commit();

            // 7. Return enrollment with details
            return Enrollment.findByPk(enrollment.id, {
                include: [{
                    model: CourseSection,
                    as: 'section',
                    include: [{ model: Course, as: 'course' }]
                }]
            });

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Drop a course (withdraw from enrollment)
     * @param {number} enrollmentId - Enrollment ID
     * @param {number} studentId - Student ID (for verification)
     * @returns {Promise<Enrollment>} - Updated enrollment
     */
    static async dropCourse(enrollmentId, studentId) {
        const transaction = await sequelize.transaction();

        try {
            const enrollment = await Enrollment.findOne({
                where: {
                    id: String(enrollmentId),
                    student_id: studentId
                },
                include: [{
                    model: CourseSection,
                    as: 'section'
                }],
                transaction
            });

            if (!enrollment) {
                throw ApiError.notFound('Kayıt bulunamadı');
            }

            if (enrollment.status !== 'enrolled') {
                throw ApiError.badRequest('Bu ders zaten bırakılmış veya tamamlanmış');
            }

            // Check drop period
            const enrollmentDate = new Date(enrollment.enrollment_date);
            const now = new Date();
            const weeksDiff = Math.floor((now - enrollmentDate) / (7 * 24 * 60 * 60 * 1000));

            if (weeksDiff > this.DROP_PERIOD_WEEKS) {
                throw ApiError.badRequest('Ders bırakma süresi dolmuş (4 hafta)');
            }

            // Update enrollment status
            enrollment.status = 'dropped';
            enrollment.drop_date = new Date();
            await enrollment.save({ transaction });

            // Decrease enrolled count
            await CourseSection.update(
                { enrolled_count: sequelize.literal('enrolled_count - 1') },
                {
                    where: { id: String(enrollment.section_id) },
                    transaction
                }
            );

            await transaction.commit();
            return enrollment;

        } catch (error) {
            await transaction.rollback();
            throw error;
        }
    }

    /**
     * Get student's enrolled courses
     * @param {number} studentId - Student ID
     * @param {Object} options - Filter options
     * @returns {Promise<Array>} - List of enrollments
     */
    static async getStudentCourses(studentId, options = {}) {
        const { semester, year, status = 'enrolled' } = options;

        const where = { student_id: studentId };
        if (status) where.status = status;

        const sectionWhere = {};
        if (semester) sectionWhere.semester = semester;
        if (year) sectionWhere.year = year;

        return Enrollment.findAll({
            where,
            include: [{
                model: CourseSection,
                as: 'section',
                where: Object.keys(sectionWhere).length > 0 ? sectionWhere : undefined,
                required: true,
                include: [
                    { model: Course, as: 'course' },
                    { model: require('../models').User, as: 'instructor', attributes: ['id', 'first_name', 'last_name', 'email'] }
                ]
            }],
            order: [['enrollment_date', 'DESC']]
        });
    }

    /**
     * Get students enrolled in a section
     * @param {number} sectionId - Section ID
     * @returns {Promise<Array>} - List of enrollments with student info
     */
    static async getSectionStudents(sectionId) {
        const sectionKey = String(sectionId);
        return Enrollment.findAll({
            where: {
                section_id: sectionKey,
                status: { [require('sequelize').Op.in]: ['enrolled', 'completed'] }
            },
            include: [{
                model: Student,
                as: 'student',
                include: [{
                    model: require('../models').User,
                    as: 'user',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                }]
            }],
            order: [[{ model: Student, as: 'student' }, { model: require('../models').User, as: 'user' }, 'last_name', 'ASC']]
        });
    }
}

module.exports = EnrollmentService;
