const { Op } = require('sequelize');
const {
    Student,
    Faculty,
    Enrollment,
    CourseSection,
    Course,
    AttendanceSession,
    ExcuseRequest,
    User,
    Department,
    Classroom
} = require('../models');
const AttendanceService = require('./attendanceService');
const ApiError = require('../utils/ApiError');

/**
 * DashboardService
 * Produces role-based dashboard summaries
 */
class DashboardService {
    /**
     * Entry point - returns dashboard data based on user role
     * @param {Object} user - Authenticated user
     */
    static async getDashboard(user) {
        if (!user) {
            throw ApiError.unauthorized('Login required');
        }

        switch (user.role) {
            case 'student':
                return this.getStudentDashboard(user.id);
            case 'faculty':
                return this.getFacultyDashboard(user.id);
            case 'admin':
                return this.getAdminDashboard();
            default:
                throw ApiError.forbidden('Dashboard is not available for this role');
        }
    }

    /**
     * Student dashboard data
     */
    static async getStudentDashboard(userId) {
        const student = await Student.findOne({
            where: { user_id: userId },
            include: [{ model: Department, as: 'department', attributes: ['id', 'name', 'code'] }]
        });

        if (!student) {
            throw ApiError.forbidden('Only students can access the dashboard');
        }

        const enrollments = await Enrollment.findAll({
            where: {
                student_id: student.id,
                status: { [Op.notIn]: ['dropped', 'withdrawn'] }
            },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [
                    { model: Course, as: 'course' },
                    { model: User, as: 'instructor', attributes: ['id', 'first_name', 'last_name'] },
                    { model: Classroom, as: 'classroom', attributes: ['building', 'room_number'] }
                ]
            }],
            order: [['updatedAt', 'DESC']]
        });

        const todayName = this.getTodayName();
        const nowMinutes = this.dateToMinutes(new Date());

        const todayClasses = enrollments.flatMap((enrollment) => {
            const section = enrollment.section;
            if (!section) return [];

            const schedule = Array.isArray(section.schedule_json) ? section.schedule_json : [];

            return schedule
                .filter((slot) => (slot.day || '').toLowerCase() === todayName.toLowerCase())
                .map((slot) => ({
                    courseCode: section.course?.code,
                    courseName: section.course?.name,
                    sectionNumber: section.section_number,
                    startTime: slot.start_time,
                    endTime: slot.end_time,
                    classroom: section.classroom
                        ? `${section.classroom.building || ''} ${section.classroom.room_number || ''}`.trim()
                        : null,
                    status: this.getScheduleStatus(slot.start_time, slot.end_time, nowMinutes)
                }));
        });

        const attendanceStats = enrollments.length
            ? await Promise.all(
                enrollments.map((enrollment) =>
                    AttendanceService.getAttendanceStats(student.id, enrollment.section_id)
                )
            )
            : [];

        const attendanceRate = attendanceStats.length
            ? Math.round(
                attendanceStats.reduce((sum, stat) => sum + (stat.attendanceRate || 0), 0) /
                attendanceStats.length
            )
            : 100;

        const recentGrades = enrollments
            .filter((enrollment) =>
                enrollment.midterm_grade !== null ||
                enrollment.final_grade !== null ||
                enrollment.letter_grade
            )
            .slice(0, 5)
            .map((enrollment) => ({
                courseCode: enrollment.section?.course?.code,
                courseName: enrollment.section?.course?.name,
                sectionNumber: enrollment.section?.section_number,
                midterm: enrollment.midterm_grade,
                final: enrollment.final_grade,
                letter: enrollment.letter_grade,
                gradePoint: enrollment.grade_point,
                updatedAt: enrollment.updatedAt
            }));

        return {
            role: 'student',
            summary: {
                registeredCourses: enrollments.length,
                gpa: this.asNumber(student.gpa, 0),
                cgpa: this.asNumber(student.cgpa, this.asNumber(student.gpa, 0)),
                attendanceRate,
                todayCourseCount: todayClasses.length
            },
            todayClasses,
            recentGrades
        };
    }

    /**
     * Faculty dashboard data
     */
    static async getFacultyDashboard(userId) {
        const faculty = await Faculty.findOne({ where: { user_id: userId } });
        if (!faculty) {
            throw ApiError.forbidden('Only faculty can access the dashboard');
        }

        const sections = await CourseSection.findAll({
            where: { instructor_id: userId },
            include: [
                { model: Course, as: 'course' },
                { model: Classroom, as: 'classroom', attributes: ['building', 'room_number'] }
            ]
        });

        const sectionIds = sections.map((s) => s.id);

        const [studentCount, pendingGrades, pendingExcuses, activeSessions] = sectionIds.length
            ? await Promise.all([
                Enrollment.count({
                    where: {
                        section_id: { [Op.in]: sectionIds },
                        status: { [Op.notIn]: ['dropped', 'withdrawn'] }
                    }
                }),
                Enrollment.count({
                    where: {
                        section_id: { [Op.in]: sectionIds },
                        status: { [Op.notIn]: ['dropped', 'withdrawn'] },
                        [Op.or]: [
                            { final_grade: { [Op.is]: null } },
                            { letter_grade: { [Op.is]: null } }
                        ]
                    }
                }),
                ExcuseRequest.count({
                    where: { status: 'pending' },
                    include: [{
                        model: AttendanceSession,
                        as: 'session',
                        where: { instructor_id: userId },
                        required: true
                    }]
                }),
                AttendanceSession.count({
                    where: {
                        instructor_id: userId,
                        status: 'active'
                    }
                })
            ])
            : [0, 0, 0, 0];

        const upcomingSessions = [];

        sections.forEach((section) => {
            const schedule = Array.isArray(section.schedule_json) ? section.schedule_json : [];
            schedule.forEach((slot) => {
                const nextDate = this.getNextOccurrence(slot.day, slot.start_time);
                if (nextDate) {
                    upcomingSessions.push({
                        courseCode: section.course?.code,
                        courseName: section.course?.name,
                        sectionNumber: section.section_number,
                        day: slot.day,
                        startTime: slot.start_time,
                        endTime: slot.end_time,
                        nextDate: nextDate.toISOString(),
                        classroom: section.classroom
                            ? `${section.classroom.building || ''} ${section.classroom.room_number || ''}`.trim()
                            : null
                    });
                }
            });
        });

        const sortedUpcoming = upcomingSessions
            .filter((item) => item.nextDate)
            .sort((a, b) => new Date(a.nextDate) - new Date(b.nextDate))
            .slice(0, 5);

        const pendingActions = [
            { label: 'Not girisi bekleyen kayit', value: pendingGrades },
            { label: 'Bekleyen mazeret', value: pendingExcuses },
            { label: 'Aktif yoklama oturumu', value: activeSessions }
        ];

        return {
            role: 'faculty',
            summary: {
                sectionCount: sections.length,
                studentCount,
                pendingGrades,
                pendingExcuses,
                activeSessions,
                upcomingClassCount: sortedUpcoming.length
            },
            upcomingSessions: sortedUpcoming,
            pendingActions
        };
    }

    /**
     * Admin dashboard data
     */
    static async getAdminDashboard() {
        const [totalStudents, facultyCount, activeCourses, activeSections, totalUsers] = await Promise.all([
            Student.count(),
            Faculty.count(),
            Course.count({ where: { is_deleted: false } }),
            CourseSection.count(),
            User.count()
        ]);

        const recentActivities = await this.getRecentActivities();

        return {
            role: 'admin',
            summary: {
                totalStudents,
                facultyCount,
                activeCourses,
                activeSections,
                totalUsers
            },
            systemStatus: {
                api: 'online',
                database: 'connected',
                checkedAt: new Date().toISOString(),
                uptimeSeconds: Math.round(process.uptime())
            },
            recentActivities
        };
    }

    /**
     * Helper: collect latest activities
     */
    static async getRecentActivities() {
        const [latestUsers, latestSections, latestEnrollments] = await Promise.all([
            User.findAll({
                order: [['createdAt', 'DESC']],
                limit: 3,
                attributes: ['id', 'first_name', 'last_name', 'role', 'createdAt']
            }),
            CourseSection.findAll({
                order: [['createdAt', 'DESC']],
                limit: 3,
                include: [{ model: Course, as: 'course' }],
                attributes: ['id', 'section_number', 'semester', 'year', 'createdAt']
            }),
            Enrollment.findAll({
                order: [['createdAt', 'DESC']],
                limit: 4,
                include: [
                    {
                        model: CourseSection,
                        as: 'section',
                        include: [{ model: Course, as: 'course' }]
                    },
                    {
                        model: Student,
                        as: 'student',
                        include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }]
                    }
                ],
                attributes: ['id', 'status', 'createdAt']
            })
        ]);

        const activities = [
            ...latestUsers.map((user) => ({
                type: 'user',
                title: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                detail: `New ${user.role} added`,
                timestamp: user.createdAt
            })),
            ...latestSections.map((section) => ({
                type: 'section',
                title: `${section.course?.code || 'Course'} - Section ${section.section_number}`,
                detail: `${section.semester?.toUpperCase?.() || ''} ${section.year}`,
                timestamp: section.createdAt
            })),
            ...latestEnrollments.map((enrollment) => ({
                type: 'enrollment',
                title: `${enrollment.student?.user?.first_name || 'Student'} ${enrollment.student?.user?.last_name || ''}`.trim(),
                detail: `${enrollment.section?.course?.code || ''} ${enrollment.section?.course?.name || ''} (${enrollment.status})`,
                timestamp: enrollment.createdAt
            }))
        ];

        return activities
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 8);
    }

    static getTodayName() {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[new Date().getDay()];
    }

    static getScheduleStatus(startTime, endTime, nowMinutes) {
        const start = this.timeToMinutes(startTime);
        const end = this.timeToMinutes(endTime || startTime);

        if (nowMinutes < start) return 'upcoming';
        if (nowMinutes > end) return 'completed';
        return 'in_progress';
    }

    static timeToMinutes(timeStr) {
        if (!timeStr) return 0;
        const [hour, minute] = timeStr.split(':').map((v) => parseInt(v, 10) || 0);
        return (hour * 60) + minute;
    }

    static dateToMinutes(date) {
        return (date.getHours() * 60) + date.getMinutes();
    }

    static getNextOccurrence(dayName, startTime) {
        if (!dayName) return null;

        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const targetIndex = days.indexOf(dayName.toLowerCase());
        if (targetIndex === -1) return null;

        const now = new Date();
        const target = new Date(now);
        const [hour, minute] = (startTime || '00:00').split(':').map((v) => parseInt(v, 10) || 0);
        target.setHours(hour, minute, 0, 0);

        let diff = targetIndex - now.getDay();
        if (diff < 0) diff += 7;
        if (diff === 0 && target <= now) diff = 7;

        target.setDate(now.getDate() + diff);
        return target;
    }

    static asNumber(value, fallback = 0) {
        if (value === null || value === undefined) return fallback;
        const parsed = typeof value === 'string' ? parseFloat(value) : Number(value);
        return Number.isNaN(parsed) ? fallback : parsed;
    }
}

module.exports = DashboardService;
