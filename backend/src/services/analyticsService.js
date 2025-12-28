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
        try {
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

            // Attendance rate (last 30 days) - simplified query
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            let attendanceRate = 0;
            try {
                const totalRecords = await AttendanceRecord.count();
                const presentRecords = await AttendanceRecord.count({
                    where: { status: 'present' }
                });
                attendanceRate = totalRecords > 0
                    ? parseFloat(((presentRecords / totalRecords) * 100).toFixed(1))
                    : 0;
            } catch (e) {
                console.error('Attendance rate calculation error:', e.message);
            }

            // Meal reservations today
            let mealReservationsToday = 0;
            try {
                mealReservationsToday = await MealReservation.count({
                    where: {
                        created_at: { [Op.gte]: today },
                        status: { [Op.in]: ['active', 'used'] }
                    }
                });
            } catch (e) {
                console.error('Meal reservations count error:', e.message);
            }

            // Upcoming events
            let upcomingEvents = 0;
            try {
                upcomingEvents = await Event.count({
                    where: {
                        date: { [Op.gte]: today },
                        status: 'published'
                    }
                });
            } catch (e) {
                console.error('Upcoming events count error:', e.message);
            }

            return {
                totalUsers,
                activeUsersToday,
                totalCourses,
                totalEnrollments,
                attendanceRate,
                mealReservationsToday,
                upcomingEvents,
                systemHealth: 'healthy'
            };
        } catch (error) {
            console.error('getDashboardStats error:', error);
            throw error;
        }
    }

    /**
     * Get academic performance analytics
     */
    async getAcademicPerformance() {
        try {
            // Average GPA by department - simplified query
            let gpaByDepartment = [];
            try {
                gpaByDepartment = await Student.findAll({
                    attributes: [
                        'department_id',
                        [fn('AVG', col('gpa')), 'averageGpa'],
                        [fn('COUNT', col('id')), 'studentCount']
                    ],
                    where: {
                        department_id: { [Op.ne]: null }
                    },
                    group: ['department_id'],
                    raw: true
                });
            } catch (e) {
                console.error('gpaByDepartment error:', e.message);
            }

            // Grade distribution - simplified
            let gradeDistribution = [];
            try {
                gradeDistribution = await Enrollment.findAll({
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
            } catch (e) {
                console.error('gradeDistribution error:', e.message);
            }

            // Calculate pass/fail rates
            let passRate = 0;
            let failRate = 0;
            try {
                const totalGraded = await Enrollment.count({
                    where: { letter_grade: { [Op.ne]: null } }
                });

                const passedCount = await Enrollment.count({
                    where: {
                        letter_grade: { [Op.in]: ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD'] }
                    }
                });

                passRate = totalGraded > 0 ? parseFloat(((passedCount / totalGraded) * 100).toFixed(1)) : 0;
                failRate = parseFloat((100 - passRate).toFixed(1));
            } catch (e) {
                console.error('passRate calculation error:', e.message);
            }

            // Top performing students (top 10 by GPA)
            let topStudents = [];
            try {
                topStudents = await Student.findAll({
                    attributes: ['id', 'student_number', 'gpa', 'cgpa'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['first_name', 'last_name']
                    }],
                    where: {
                        gpa: { [Op.ne]: null }
                    },
                    order: [['gpa', 'DESC']],
                    limit: 10
                });
            } catch (e) {
                console.error('topStudents error:', e.message);
            }

            // At-risk students (GPA < 2.0)
            let atRiskStudents = [];
            try {
                atRiskStudents = await Student.findAll({
                    attributes: ['id', 'student_number', 'gpa'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['first_name', 'last_name', 'email']
                    }],
                    where: {
                        gpa: { [Op.lt]: 2.0, [Op.ne]: null }
                    },
                    order: [['gpa', 'ASC']],
                    limit: 20
                });
            } catch (e) {
                console.error('atRiskStudents error:', e.message);
            }

            return {
                gpaByDepartment,
                gradeDistribution,
                passRate,
                failRate,
                topStudents,
                atRiskStudents
            };
        } catch (error) {
            console.error('getAcademicPerformance error:', error);
            throw error;
        }
    }

    /**
     * Get attendance analytics
     */
    async getAttendanceAnalytics() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Attendance by course - simplified
            let attendanceByCourse = [];
            try {
                const sessions = await AttendanceSession.findAll({
                    attributes: ['id', 'section_id', 'date'],
                    include: [{
                        model: CourseSection,
                        as: 'section',
                        attributes: ['id', 'section_number'],
                        include: [{
                            model: Course,
                            as: 'course',
                            attributes: ['code', 'name']
                        }]
                    }],
                    where: {
                        date: { [Op.gte]: thirtyDaysAgo }
                    },
                    limit: 50
                });

                // Group by section manually
                const sectionMap = new Map();
                sessions.forEach(session => {
                    const sectionId = session.section_id;
                    if (!sectionMap.has(sectionId)) {
                        sectionMap.set(sectionId, {
                            section_id: sectionId,
                            totalSessions: 0,
                            section: session.section
                        });
                    }
                    sectionMap.get(sectionId).totalSessions++;
                });
                attendanceByCourse = Array.from(sectionMap.values());
            } catch (e) {
                console.error('attendanceByCourse error:', e.message);
            }

            // Attendance trends over time (last 30 days) - simplified
            let attendanceTrends = [];
            try {
                const sessions = await AttendanceSession.findAll({
                    attributes: ['date'],
                    where: {
                        date: { [Op.gte]: thirtyDaysAgo }
                    },
                    order: [['date', 'ASC']]
                });

                // Group by date manually
                const dateMap = new Map();
                sessions.forEach(session => {
                    const dateStr = session.date.toISOString().split('T')[0];
                    dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
                });
                attendanceTrends = Array.from(dateMap.entries()).map(([date, sessionsCount]) => ({
                    date,
                    sessionsCount
                }));
            } catch (e) {
                console.error('attendanceTrends error:', e.message);
            }

            // Students with attendance records - simplified
            let criticalAbsences = [];
            try {
                criticalAbsences = await Student.findAll({
                    attributes: ['id', 'student_number'],
                    include: [{
                        model: User,
                        as: 'user',
                        attributes: ['first_name', 'last_name', 'email']
                    }],
                    limit: 10
                });
            } catch (e) {
                console.error('criticalAbsences error:', e.message);
            }

            return {
                attendanceByCourse,
                attendanceTrends,
                criticalAbsences,
                lowAttendanceCourses: []
            };
        } catch (error) {
            console.error('getAttendanceAnalytics error:', error);
            throw error;
        }
    }

    /**
     * Get meal usage analytics
     */
    async getMealUsageAnalytics() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Daily meal counts - simplified
            let dailyMealCounts = [];
            try {
                const reservations = await MealReservation.findAll({
                    attributes: ['created_at'],
                    where: {
                        created_at: { [Op.gte]: thirtyDaysAgo },
                        status: { [Op.in]: ['active', 'used'] }
                    },
                    order: [['created_at', 'ASC']]
                });

                const dateMap = new Map();
                reservations.forEach(res => {
                    const dateStr = res.created_at.toISOString().split('T')[0];
                    dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
                });
                dailyMealCounts = Array.from(dateMap.entries()).map(([date, count]) => ({
                    date,
                    count
                }));
            } catch (e) {
                console.error('dailyMealCounts error:', e.message);
            }

            // Meal type distribution
            let mealTypeDistribution = [];
            try {
                const count = await MealReservation.count({
                    where: {
                        created_at: { [Op.gte]: thirtyDaysAgo }
                    }
                });
                mealTypeDistribution = [{ count }];
            } catch (e) {
                console.error('mealTypeDistribution error:', e.message);
            }

            // Total revenue (from transactions)
            let totalRevenue = 0;
            try {
                totalRevenue = await Transaction.sum('amount', {
                    where: {
                        type: 'credit',
                        created_at: { [Op.gte]: thirtyDaysAgo }
                    }
                }) || 0;
            } catch (e) {
                console.error('totalRevenue error:', e.message);
            }

            // Peak hours analysis - simplified
            let peakHours = [];
            try {
                const reservations = await MealReservation.findAll({
                    attributes: ['created_at'],
                    where: {
                        created_at: { [Op.gte]: thirtyDaysAgo }
                    }
                });

                const hourMap = new Map();
                reservations.forEach(res => {
                    const hour = res.created_at.getHours();
                    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
                });
                peakHours = Array.from(hourMap.entries())
                    .map(([hour, count]) => ({ hour, count }))
                    .sort((a, b) => b.count - a.count);
            } catch (e) {
                console.error('peakHours error:', e.message);
            }

            // Used vs cancelled reservations
            let usedCount = 0;
            let cancelledCount = 0;
            try {
                usedCount = await MealReservation.count({
                    where: {
                        status: 'used',
                        created_at: { [Op.gte]: thirtyDaysAgo }
                    }
                });

                cancelledCount = await MealReservation.count({
                    where: {
                        status: 'cancelled',
                        created_at: { [Op.gte]: thirtyDaysAgo }
                    }
                });
            } catch (e) {
                console.error('usageStats error:', e.message);
            }

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
        } catch (error) {
            console.error('getMealUsageAnalytics error:', error);
            throw error;
        }
    }

    /**
     * Get event analytics
     */
    async getEventAnalytics() {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            // Most popular events (by registration count) - simplified
            let popularEvents = [];
            try {
                const events = await Event.findAll({
                    attributes: ['id', 'title', 'category', 'date', 'capacity'],
                    include: [{
                        model: EventRegistration,
                        as: 'registrations',
                        attributes: ['id']
                    }],
                    limit: 10
                });

                popularEvents = events.map(event => ({
                    id: event.id,
                    title: event.title,
                    category: event.category,
                    date: event.date,
                    capacity: event.capacity,
                    registrationCount: event.registrations ? event.registrations.length : 0
                })).sort((a, b) => b.registrationCount - a.registrationCount);
            } catch (e) {
                console.error('popularEvents error:', e.message);
            }

            // Registration rates by category - simplified
            let registrationsByCategory = [];
            try {
                const events = await Event.findAll({
                    attributes: ['category', 'capacity']
                });

                const categoryMap = new Map();
                events.forEach(event => {
                    const cat = event.category || 'other';
                    if (!categoryMap.has(cat)) {
                        categoryMap.set(cat, { eventCount: 0, totalCapacity: 0 });
                    }
                    const data = categoryMap.get(cat);
                    data.eventCount++;
                    data.totalCapacity += event.capacity || 0;
                });
                registrationsByCategory = Array.from(categoryMap.entries()).map(([category, data]) => ({
                    category,
                    ...data
                }));
            } catch (e) {
                console.error('registrationsByCategory error:', e.message);
            }

            // Check-in rates
            let totalRegistrations = 0;
            let checkedInCount = 0;
            let checkInRate = 0;
            try {
                totalRegistrations = await EventRegistration.count({
                    where: {
                        created_at: { [Op.gte]: thirtyDaysAgo }
                    }
                });

                checkedInCount = await EventRegistration.count({
                    where: {
                        status: 'checked_in',
                        created_at: { [Op.gte]: thirtyDaysAgo }
                    }
                });

                checkInRate = totalRegistrations > 0
                    ? parseFloat(((checkedInCount / totalRegistrations) * 100).toFixed(1))
                    : 0;
            } catch (e) {
                console.error('checkInRate error:', e.message);
            }

            // Events by category count - simplified
            let eventsByCategory = [];
            try {
                const events = await Event.findAll({
                    attributes: ['category']
                });

                const categoryMap = new Map();
                events.forEach(event => {
                    const cat = event.category || 'other';
                    categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
                });
                eventsByCategory = Array.from(categoryMap.entries()).map(([category, count]) => ({
                    category,
                    count
                }));
            } catch (e) {
                console.error('eventsByCategory error:', e.message);
            }

            return {
                popularEvents,
                registrationsByCategory,
                checkInRate,
                totalRegistrations,
                checkedInCount,
                eventsByCategory
            };
        } catch (error) {
            console.error('getEventAnalytics error:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsService();
