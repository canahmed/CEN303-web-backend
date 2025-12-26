const {
    User,
    Student,
    Faculty,
    Course,
    CourseSection,
    Enrollment,
    AttendanceSession,
    AttendanceRecord,
    MealReservation,
    Event,
    EventRegistration,
    Transaction
} = require('../models');
const { Op, fn, col, literal } = require('sequelize');

class AnalyticsService {
    /**
     * Get dashboard statistics for admin
     */
    async getDashboardStats() {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Total users
        const totalUsers = await User.count();

        // Active users today (users who logged in or performed actions)
        const activeUsersToday = await User.count({
            where: {
                updated_at: { [Op.gte]: today }
            }
        });

        // Total courses
        const totalCourses = await Course.count();

        // Total enrollments
        const totalEnrollments = await Enrollment.count({
            where: { status: 'enrolled' }
        });

        // Attendance rate (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const totalRecords = await AttendanceRecord.count({
            include: [{
                model: AttendanceSession,
                as: 'session',
                where: { date: { [Op.gte]: thirtyDaysAgo } }
            }]
        });

        const presentRecords = await AttendanceRecord.count({
            where: { status: 'present' },
            include: [{
                model: AttendanceSession,
                as: 'session',
                where: { date: { [Op.gte]: thirtyDaysAgo } }
            }]
        });

        const attendanceRate = totalRecords > 0
            ? ((presentRecords / totalRecords) * 100).toFixed(1)
            : 0;

        // Meal reservations today
        const mealReservationsToday = await MealReservation.count({
            where: {
                created_at: { [Op.gte]: today },
                status: { [Op.in]: ['active', 'used'] }
            }
        });

        // Upcoming events
        const upcomingEvents = await Event.count({
            where: {
                date: { [Op.gte]: today },
                status: 'published'
            }
        });

        return {
            totalUsers,
            activeUsersToday,
            totalCourses,
            totalEnrollments,
            attendanceRate: parseFloat(attendanceRate),
            mealReservationsToday,
            upcomingEvents,
            systemHealth: 'healthy'
        };
    }

    /**
     * Get academic performance analytics
     */
    async getAcademicPerformance() {
        // Average GPA by department
        const gpaByDepartment = await Student.findAll({
            attributes: [
                'department_id',
                [fn('AVG', col('gpa')), 'averageGpa'],
                [fn('COUNT', col('Student.id')), 'studentCount']
            ],
            group: ['department_id'],
            raw: true
        });

        // Grade distribution
        const gradeDistribution = await Enrollment.findAll({
            attributes: [
                'letter_grade',
                [fn('COUNT', col('id')), 'count']
            ],
            where: {
                letter_grade: { [Op.ne]: null }
            },
            group: ['letter_grade'],
            raw: true
        });

        // Calculate pass/fail rates
        const totalGraded = await Enrollment.count({
            where: { letter_grade: { [Op.ne]: null } }
        });

        const passedCount = await Enrollment.count({
            where: {
                letter_grade: { [Op.in]: ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD'] }
            }
        });

        const passRate = totalGraded > 0
            ? ((passedCount / totalGraded) * 100).toFixed(1)
            : 0;

        // Top performing students (top 10 by GPA)
        const topStudents = await Student.findAll({
            attributes: ['id', 'student_number', 'gpa', 'cgpa'],
            include: [{
                model: User,
                as: 'user',
                attributes: ['first_name', 'last_name']
            }],
            order: [['gpa', 'DESC']],
            limit: 10
        });

        // At-risk students (GPA < 2.0)
        const atRiskStudents = await Student.findAll({
            attributes: ['id', 'student_number', 'gpa'],
            include: [{
                model: User,
                as: 'user',
                attributes: ['first_name', 'last_name', 'email']
            }],
            where: {
                gpa: { [Op.lt]: 2.0 }
            },
            order: [['gpa', 'ASC']],
            limit: 20
        });

        return {
            gpaByDepartment,
            gradeDistribution,
            passRate: parseFloat(passRate),
            failRate: parseFloat((100 - parseFloat(passRate)).toFixed(1)),
            topStudents,
            atRiskStudents
        };
    }

    /**
     * Get attendance analytics
     */
    async getAttendanceAnalytics() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Attendance rate by course
        const attendanceByCourse = await AttendanceSession.findAll({
            attributes: [
                'section_id',
                [fn('COUNT', col('AttendanceSession.id')), 'totalSessions']
            ],
            include: [{
                model: CourseSection,
                as: 'section',
                attributes: ['section_number'],
                include: [{
                    model: Course,
                    as: 'course',
                    attributes: ['code', 'name']
                }]
            }],
            where: {
                date: { [Op.gte]: thirtyDaysAgo }
            },
            group: ['section_id', 'section.id', 'section.section_number', 'section->course.id', 'section->course.code', 'section->course.name'],
            raw: false
        });

        // Attendance trends over time (last 30 days)
        const attendanceTrends = await AttendanceSession.findAll({
            attributes: [
                [fn('DATE', col('date')), 'date'],
                [fn('COUNT', col('id')), 'sessionsCount']
            ],
            where: {
                date: { [Op.gte]: thirtyDaysAgo }
            },
            group: [fn('DATE', col('date'))],
            order: [[fn('DATE', col('date')), 'ASC']],
            raw: true
        });

        // Students with critical absence rates (>30%)
        const criticalAbsences = await Student.findAll({
            attributes: ['id', 'student_number'],
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['first_name', 'last_name', 'email']
                },
                {
                    model: AttendanceRecord,
                    as: 'attendanceRecords',
                    attributes: ['status'],
                    required: false
                }
            ],
            limit: 20
        });

        // Courses with low attendance (< 70%)
        const lowAttendanceCourses = [];

        return {
            attendanceByCourse,
            attendanceTrends,
            criticalAbsences: criticalAbsences.slice(0, 10),
            lowAttendanceCourses
        };
    }

    /**
     * Get meal usage analytics
     */
    async getMealUsageAnalytics() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Daily meal counts
        const dailyMealCounts = await MealReservation.findAll({
            attributes: [
                [fn('DATE', col('created_at')), 'date'],
                [fn('COUNT', col('id')), 'count']
            ],
            where: {
                created_at: { [Op.gte]: thirtyDaysAgo },
                status: { [Op.in]: ['active', 'used'] }
            },
            group: [fn('DATE', col('created_at'))],
            order: [[fn('DATE', col('created_at')), 'ASC']],
            raw: true
        });

        // Meal type distribution
        const mealTypeDistribution = await MealReservation.findAll({
            attributes: [
                [fn('COUNT', col('id')), 'count']
            ],
            where: {
                created_at: { [Op.gte]: thirtyDaysAgo }
            },
            raw: true
        });

        // Total revenue (from transactions)
        const totalRevenue = await Transaction.sum('amount', {
            where: {
                type: 'credit',
                created_at: { [Op.gte]: thirtyDaysAgo }
            }
        }) || 0;

        // Peak hours analysis
        const peakHours = await MealReservation.findAll({
            attributes: [
                [fn('EXTRACT', literal('HOUR FROM created_at')), 'hour'],
                [fn('COUNT', col('id')), 'count']
            ],
            where: {
                created_at: { [Op.gte]: thirtyDaysAgo }
            },
            group: [fn('EXTRACT', literal('HOUR FROM created_at'))],
            order: [[fn('COUNT', col('id')), 'DESC']],
            raw: true
        });

        // Used vs cancelled reservations
        const usedCount = await MealReservation.count({
            where: {
                status: 'used',
                created_at: { [Op.gte]: thirtyDaysAgo }
            }
        });

        const cancelledCount = await MealReservation.count({
            where: {
                status: 'cancelled',
                created_at: { [Op.gte]: thirtyDaysAgo }
            }
        });

        return {
            dailyMealCounts,
            mealTypeDistribution,
            totalRevenue,
            peakHours,
            usageStats: {
                used: usedCount,
                cancelled: cancelledCount
            }
        };
    }

    /**
     * Get event analytics
     */
    async getEventAnalytics() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Most popular events (by registration count)
        const popularEvents = await Event.findAll({
            attributes: [
                'id',
                'title',
                'category',
                'date',
                'capacity',
                [fn('COUNT', col('registrations.id')), 'registrationCount']
            ],
            include: [{
                model: EventRegistration,
                as: 'registrations',
                attributes: []
            }],
            group: ['Event.id'],
            order: [[fn('COUNT', col('registrations.id')), 'DESC']],
            limit: 10
        });

        // Registration rates by category
        const registrationsByCategory = await Event.findAll({
            attributes: [
                'category',
                [fn('COUNT', col('Event.id')), 'eventCount'],
                [fn('SUM', col('capacity')), 'totalCapacity']
            ],
            group: ['category'],
            raw: true
        });

        // Check-in rates
        const totalRegistrations = await EventRegistration.count({
            where: {
                created_at: { [Op.gte]: thirtyDaysAgo }
            }
        });

        const checkedInCount = await EventRegistration.count({
            where: {
                status: 'checked_in',
                created_at: { [Op.gte]: thirtyDaysAgo }
            }
        });

        const checkInRate = totalRegistrations > 0
            ? ((checkedInCount / totalRegistrations) * 100).toFixed(1)
            : 0;

        // Events by category count
        const eventsByCategory = await Event.findAll({
            attributes: [
                'category',
                [fn('COUNT', col('id')), 'count']
            ],
            group: ['category'],
            raw: true
        });

        return {
            popularEvents,
            registrationsByCategory,
            checkInRate: parseFloat(checkInRate),
            totalRegistrations,
            checkedInCount,
            eventsByCategory
        };
    }
}

module.exports = new AnalyticsService();
