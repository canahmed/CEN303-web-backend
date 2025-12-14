const { Enrollment, CourseSection, Course, Student, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * GradeService - GPA/CGPA calculation and grade management
 */
class GradeService {
    // Grade point mapping
    static GRADE_POINTS = {
        'AA': 4.00,
        'BA': 3.50,
        'BB': 3.00,
        'CB': 2.50,
        'CC': 2.00,
        'DC': 1.50,
        'DD': 1.00,
        'FD': 0.50,
        'FF': 0.00,
        'NA': 0.00, // Not Attended
        'I': null,  // Incomplete
        'W': null   // Withdrawn
    };

    // Grade boundaries based on weighted average
    static GRADE_BOUNDARIES = [
        { min: 90, letter: 'AA' },
        { min: 85, letter: 'BA' },
        { min: 80, letter: 'BB' },
        { min: 75, letter: 'CB' },
        { min: 70, letter: 'CC' },
        { min: 65, letter: 'DC' },
        { min: 60, letter: 'DD' },
        { min: 50, letter: 'FD' },
        { min: 0, letter: 'FF' }
    ];

    /**
     * Calculate letter grade from numeric scores
     * @param {number} midterm - Midterm grade (0-100)
     * @param {number} final - Final grade (0-100)
     * @param {number} midtermWeight - Midterm weight (default 0.4)
     * @returns {string} - Letter grade
     */
    static calculateLetterGrade(midterm, final, midtermWeight = 0.4) {
        if (midterm === null || final === null) {
            return null;
        }

        // Must pass final exam (minimum 50)
        if (final < 50) {
            return 'FF';
        }

        const weighted = (midterm * midtermWeight) + (final * (1 - midtermWeight));

        for (const boundary of this.GRADE_BOUNDARIES) {
            if (weighted >= boundary.min) {
                return boundary.letter;
            }
        }

        return 'FF';
    }

    /**
     * Get grade point for a letter grade
     * @param {string} letterGrade - Letter grade
     * @returns {number|null} - Grade point or null
     */
    static getGradePoint(letterGrade) {
        return this.GRADE_POINTS[letterGrade] ?? null;
    }

    /**
     * Enter grades for a student in a section
     * @param {number} enrollmentId - Enrollment ID
     * @param {Object} grades - {midterm_grade, final_grade}
     * @param {number} instructorId - Instructor ID (for verification)
     * @returns {Promise<Enrollment>} - Updated enrollment
     */
    static async enterGrades(enrollmentId, grades, instructorId) {
        const enrollment = await Enrollment.findByPk(enrollmentId, {
            include: [{
                model: CourseSection,
                as: 'section'
            }]
        });

        if (!enrollment) {
            throw ApiError.notFound('Kayıt bulunamadı');
        }

        // Verify instructor teaches this section
        if (enrollment.section.instructor_id !== instructorId) {
            throw ApiError.forbidden('Bu dersin notlarını girme yetkiniz yok');
        }

        // Calculate letter grade and grade point
        const letterGrade = this.calculateLetterGrade(grades.midterm_grade, grades.final_grade);
        const gradePoint = this.getGradePoint(letterGrade);

        // Update enrollment
        await enrollment.update({
            midterm_grade: grades.midterm_grade,
            final_grade: grades.final_grade,
            letter_grade: letterGrade,
            grade_point: gradePoint,
            status: letterGrade && letterGrade !== 'FF' ? 'completed' : 'failed'
        });

        // Recalculate student's CGPA
        const student = await Student.findByPk(enrollment.student_id);
        if (student) {
            const cgpa = await this.calculateCGPA(student.id);
            await student.update({ cgpa });
        }

        return enrollment;
    }

    /**
     * Calculate GPA for a specific semester
     * @param {number} studentId - Student ID
     * @param {string} semester - Semester
     * @param {number} year - Year
     * @returns {Promise<number>} - GPA
     */
    static async calculateGPA(studentId, semester, year) {
        const enrollments = await Enrollment.findAll({
            where: {
                student_id: studentId,
                status: { [require('sequelize').Op.in]: ['completed', 'failed'] }
            },
            include: [{
                model: CourseSection,
                as: 'section',
                where: { semester, year },
                required: true,
                include: [{ model: Course, as: 'course' }]
            }]
        });

        return this.calculateWeightedGPA(enrollments);
    }

    /**
     * Calculate Cumulative GPA
     * @param {number} studentId - Student ID
     * @returns {Promise<number>} - CGPA
     */
    static async calculateCGPA(studentId) {
        const enrollments = await Enrollment.findAll({
            where: {
                student_id: studentId,
                status: { [require('sequelize').Op.in]: ['completed', 'failed'] },
                grade_point: { [require('sequelize').Op.not]: null }
            },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: Course, as: 'course' }]
            }]
        });

        return this.calculateWeightedGPA(enrollments);
    }

    /**
     * Calculate weighted GPA from enrollments
     * @param {Array} enrollments - List of enrollments
     * @returns {number} - Weighted GPA
     */
    static calculateWeightedGPA(enrollments) {
        let totalPoints = 0;
        let totalCredits = 0;

        for (const enrollment of enrollments) {
            if (enrollment.grade_point !== null && enrollment.section?.course) {
                const credits = enrollment.section.course.credits;
                totalPoints += enrollment.grade_point * credits;
                totalCredits += credits;
            }
        }

        if (totalCredits === 0) return 0;
        return Math.round((totalPoints / totalCredits) * 100) / 100;
    }

    /**
     * Generate transcript data
     * @param {number} studentId - Student ID
     * @returns {Promise<Object>} - Transcript data
     */
    static async generateTranscript(studentId) {
        const student = await Student.findByPk(studentId, {
            include: [{
                model: require('../models').User,
                as: 'user',
                attributes: ['first_name', 'last_name', 'email']
            }, {
                model: require('../models').Department,
                as: 'department'
            }]
        });

        if (!student) {
            throw ApiError.notFound('Öğrenci bulunamadı');
        }

        const enrollments = await Enrollment.findAll({
            where: {
                student_id: studentId,
                status: { [require('sequelize').Op.in]: ['completed', 'failed'] }
            },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: Course, as: 'course' }]
            }],
            order: [
                [{ model: CourseSection, as: 'section' }, 'year', 'ASC'],
                [{ model: CourseSection, as: 'section' }, 'semester', 'ASC']
            ]
        });

        // Group by semester
        const semesters = {};
        for (const enrollment of enrollments) {
            const key = `${enrollment.section.year}-${enrollment.section.semester}`;
            if (!semesters[key]) {
                semesters[key] = {
                    year: enrollment.section.year,
                    semester: enrollment.section.semester,
                    courses: [],
                    gpa: 0,
                    totalCredits: 0,
                    totalPoints: 0
                };
            }

            const course = enrollment.section.course;
            semesters[key].courses.push({
                code: course.code,
                name: course.name,
                credits: course.credits,
                ects: course.ects,
                letterGrade: enrollment.letter_grade,
                gradePoint: enrollment.grade_point
            });

            if (enrollment.grade_point !== null) {
                semesters[key].totalCredits += course.credits;
                semesters[key].totalPoints += enrollment.grade_point * course.credits;
            }
        }

        // Calculate semester GPAs
        for (const key in semesters) {
            const sem = semesters[key];
            sem.gpa = sem.totalCredits > 0 ?
                Math.round((sem.totalPoints / sem.totalCredits) * 100) / 100 : 0;
        }

        const cgpa = await this.calculateCGPA(studentId);

        return {
            student: {
                studentNumber: student.student_number,
                firstName: student.user.first_name,
                lastName: student.user.last_name,
                email: student.user.email,
                department: student.department?.name,
                enrollmentYear: student.enrollment_year
            },
            semesters: Object.values(semesters),
            cgpa,
            generatedAt: new Date().toISOString()
        };
    }

    /**
     * Get student's all grades
     * @param {number} studentId - Student ID
     * @returns {Promise<Array>} - Grades list
     */
    static async getStudentGrades(studentId) {
        return Enrollment.findAll({
            where: {
                student_id: studentId
            },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: Course, as: 'course' }]
            }],
            order: [['created_at', 'DESC']]
        });
    }
}

module.exports = GradeService;
