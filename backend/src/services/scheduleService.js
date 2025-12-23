const {
    Schedule,
    ClassroomReservation,
    CourseSection,
    Classroom,
    Course,
    Enrollment,
    User
} = require('../models');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');
const CSPScheduler = require('./cspScheduler');

// Day name mapping
const DAY_NAMES = {
    1: 'Pazartesi',
    2: 'Salı',
    3: 'Çarşamba',
    4: 'Perşembe',
    5: 'Cuma'
};

class ScheduleService {
    /**
     * Generate schedule using CSP algorithm (admin only)
     */
    static async generateSchedule(semester, year) {
        // Get all sections for the semester
        const sections = await CourseSection.findAll({
            where: {
                semester: semester || 'Güz',
                year: year || new Date().getFullYear()
            },
            include: [
                { model: Course, as: 'course' },
                { model: User, as: 'instructor', attributes: ['id', 'first_name', 'last_name'] }
            ]
        });

        if (sections.length === 0) {
            throw ApiError.badRequest('Programlanacak ders şubesi bulunamadı');
        }

        // Get all available classrooms
        const classrooms = await Classroom.findAll({
            order: [['capacity', 'DESC']]
        });

        if (classrooms.length === 0) {
            throw ApiError.badRequest('Kullanılabilir derslik bulunamadı');
        }

        // Initialize CSP Scheduler
        const scheduler = new CSPScheduler();

        // Generate schedule
        const result = await scheduler.generate(sections, classrooms);

        // Save to database if successful
        if (result.success && result.schedule.length > 0) {
            // Clear existing schedules for these sections
            const sectionIds = sections.map(s => s.id);
            await Schedule.destroy({
                where: { section_id: { [Op.in]: sectionIds } }
            });

            // Save new schedules
            const savedSchedules = await scheduler.saveToDatabase(result.schedule);
            result.saved_count = savedSchedules.length;
        }

        return result;
    }

    /**
     * Get schedule by ID
     */
    static async getScheduleById(scheduleId) {
        const schedule = await Schedule.findByPk(scheduleId, {
            include: [
                {
                    model: CourseSection,
                    as: 'section',
                    include: [
                        { model: Course, as: 'course' },
                        { model: User, as: 'instructor', attributes: ['id', 'first_name', 'last_name'] }
                    ]
                },
                { model: Classroom, as: 'classroom' }
            ]
        });

        if (!schedule) {
            throw ApiError.notFound('Program bulunamadı');
        }

        return {
            id: schedule.id,
            day_of_week: schedule.day_of_week,
            day_name: DAY_NAMES[schedule.day_of_week],
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            course_code: schedule.section?.course?.code,
            course_name: schedule.section?.course?.name,
            section_number: schedule.section?.section_number,
            instructor: schedule.section?.instructor ?
                `${schedule.section.instructor.first_name} ${schedule.section.instructor.last_name}` : null,
            classroom: schedule.classroom?.room_number,
            building: schedule.classroom?.building
        };
    }

    /**
     * Get weekly schedule for a user (student or faculty)
     */
    static async getMySchedule(userId, userRole) {
        let scheduleData = [];

        if (userRole === 'student') {
            // First find the student record for this user
            const Student = require('../models').Student;
            const student = await Student.findOne({ where: { user_id: userId } });

            if (!student) {
                return { schedule: [], count: 0 };
            }

            // Get student's enrolled sections
            const enrollments = await Enrollment.findAll({
                where: {
                    student_id: student.id,
                    status: { [Op.in]: ['enrolled', 'completed'] }
                },
                include: [{
                    model: CourseSection,
                    as: 'section',
                    include: [
                        { model: Course, as: 'course' },
                        { model: User, as: 'instructor', attributes: ['id', 'first_name', 'last_name'] },
                        { model: Classroom, as: 'classroom' },
                        { model: Schedule, as: 'schedules', include: [{ model: Classroom, as: 'classroom' }] }
                    ]
                }]
            });

            for (const enrollment of enrollments) {
                const section = enrollment.section;
                if (!section) continue;

                for (const schedule of (section.schedules || [])) {
                    scheduleData.push({
                        id: schedule.id,
                        day_of_week: schedule.day_of_week,
                        day_name: DAY_NAMES[schedule.day_of_week],
                        start_time: schedule.start_time,
                        end_time: schedule.end_time,
                        course_code: section.course?.code,
                        course_name: section.course?.name,
                        section_number: section.section_number,
                        instructor: section.instructor ? `${section.instructor.first_name} ${section.instructor.last_name}` : null,
                        classroom: schedule.classroom?.room_number || section.classroom?.room_number,
                        building: schedule.classroom?.building || section.classroom?.building
                    });
                }
            }
        } else if (userRole === 'faculty') {
            // Get faculty's teaching sections
            const sections = await CourseSection.findAll({
                where: { instructor_id: userId },
                include: [
                    { model: Course, as: 'course' },
                    { model: Classroom, as: 'classroom' },
                    { model: Schedule, as: 'schedules', include: [{ model: Classroom, as: 'classroom' }] }
                ]
            });

            for (const section of sections) {
                for (const schedule of (section.schedules || [])) {
                    scheduleData.push({
                        id: schedule.id,
                        day_of_week: schedule.day_of_week,
                        day_name: DAY_NAMES[schedule.day_of_week],
                        start_time: schedule.start_time,
                        end_time: schedule.end_time,
                        course_code: section.course?.code,
                        course_name: section.course?.name,
                        section_number: section.section_number,
                        classroom: schedule.classroom?.room_number || section.classroom?.room_number,
                        building: schedule.classroom?.building || section.classroom?.building,
                        enrolled_count: section.enrolled_count,
                        capacity: section.capacity
                    });
                }
            }
        }

        // Sort by day and time
        scheduleData.sort((a, b) => {
            if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
            return a.start_time.localeCompare(b.start_time);
        });

        return scheduleData;
    }

    /**
     * Generate iCal (.ics) format for schedule
     */
    static async generateICal(userId, userRole) {
        const schedule = await this.getMySchedule(userId, userRole);

        let ical = 'BEGIN:VCALENDAR\r\n';
        ical += 'VERSION:2.0\r\n';
        ical += 'PRODID:-//Smart Campus//Schedule//TR\r\n';
        ical += 'CALSCALE:GREGORIAN\r\n';
        ical += 'METHOD:PUBLISH\r\n';

        // Get current semester dates (approximate)
        const now = new Date();
        const semesterStart = new Date(now.getFullYear(), now.getMonth() >= 8 ? 8 : 1, 1);
        const semesterEnd = new Date(now.getFullYear(), now.getMonth() >= 8 ? 11 : 5, 30);

        for (const item of schedule) {
            // Create recurring event for each class
            const startDate = this.getNextDayOfWeek(semesterStart, item.day_of_week);
            const uid = `${item.id}@smartcampus.edu`;

            ical += 'BEGIN:VEVENT\r\n';
            ical += `UID:${uid}\r\n`;
            ical += `DTSTART;TZID=Europe/Istanbul:${this.formatICalDate(startDate, item.start_time)}\r\n`;
            ical += `DTEND;TZID=Europe/Istanbul:${this.formatICalDate(startDate, item.end_time)}\r\n`;
            ical += `RRULE:FREQ=WEEKLY;UNTIL=${this.formatICalDate(semesterEnd, '23:59')}\r\n`;
            ical += `SUMMARY:${item.course_code} - ${item.course_name}\r\n`;
            ical += `LOCATION:${item.building || ''} ${item.classroom || ''}\r\n`;
            if (item.instructor) ical += `DESCRIPTION:Öğretim Üyesi: ${item.instructor}\r\n`;
            ical += 'END:VEVENT\r\n';
        }

        ical += 'END:VCALENDAR\r\n';
        return ical;
    }

    /**
     * Helper: Get next occurrence of a day of week
     */
    static getNextDayOfWeek(date, dayOfWeek) {
        const result = new Date(date);
        const currentDay = result.getDay();
        const targetDay = dayOfWeek === 7 ? 0 : dayOfWeek;
        const diff = (targetDay - currentDay + 7) % 7;
        result.setDate(result.getDate() + diff);
        return result;
    }

    /**
     * Helper: Format date for iCal
     */
    static formatICalDate(date, time) {
        const [hours, minutes] = time.split(':');
        const d = new Date(date);
        d.setHours(parseInt(hours), parseInt(minutes), 0);
        return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    }

    /**
     * Create classroom reservation
     */
    static async createReservation(userId, data) {
        let { classroom_id, date, start_time, end_time, purpose } = data;

        // Extract date and time from ISO datetime strings
        if (start_time && start_time.includes('T')) {
            const startDate = new Date(start_time);
            if (!date) {
                date = startDate.toISOString().slice(0, 10);
            }
            // Extract time as HH:mm format
            start_time = startDate.toTimeString().slice(0, 5);
        }

        if (end_time && end_time.includes('T')) {
            const endDate = new Date(end_time);
            end_time = endDate.toTimeString().slice(0, 5);
        }

        // Check if classroom exists
        const classroom = await Classroom.findByPk(classroom_id);
        if (!classroom) throw ApiError.notFound('Derslik bulunamadı');

        // Check for conflicts
        const conflict = await ClassroomReservation.findOne({
            where: {
                classroom_id,
                date,
                status: { [Op.in]: ['pending', 'approved'] },
                [Op.or]: [
                    { start_time: { [Op.lt]: end_time }, end_time: { [Op.gt]: start_time } }
                ]
            }
        });

        if (conflict) {
            throw ApiError.conflict('Bu zaman diliminde derslik zaten rezerve edilmiş');
        }

        return ClassroomReservation.create({
            classroom_id,
            user_id: userId,
            date,
            start_time,
            end_time,
            purpose,
            status: 'pending'
        });
    }

    /**
     * Get reservations
     */
    static async getReservations({ classroomId, date, status, userId, page = 1, limit = 20 } = {}) {
        const where = {};
        if (classroomId) where.classroom_id = classroomId;
        if (date) where.date = date;
        if (status) where.status = status;
        if (userId) where.user_id = userId;

        const { rows, count } = await ClassroomReservation.findAndCountAll({
            where,
            include: [
                { model: Classroom, as: 'classroom' },
                { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }
            ],
            order: [['date', 'ASC'], ['start_time', 'ASC']],
            limit,
            offset: (page - 1) * limit
        });

        return { reservations: rows, total: count, page, limit };
    }

    /**
     * Approve reservation (admin only)
     */
    static async approveReservation(reservationId, approverId) {
        const reservation = await ClassroomReservation.findByPk(reservationId);
        if (!reservation) throw ApiError.notFound('Rezervasyon bulunamadı');
        if (reservation.status !== 'pending') throw ApiError.badRequest('Bu rezervasyon onaylanamaz');

        await reservation.update({
            status: 'approved',
            approved_by: approverId,
            approved_at: new Date()
        });

        return { message: 'Rezervasyon onaylandı' };
    }

    /**
     * Reject reservation (admin only)
     */
    static async rejectReservation(reservationId, approverId, reason) {
        const reservation = await ClassroomReservation.findByPk(reservationId);
        if (!reservation) throw ApiError.notFound('Rezervasyon bulunamadı');
        if (reservation.status !== 'pending') throw ApiError.badRequest('Bu rezervasyon reddedilemez');

        await reservation.update({
            status: 'rejected',
            approved_by: approverId,
            approved_at: new Date(),
            rejection_reason: reason
        });

        return { message: 'Rezervasyon reddedildi' };
    }

    /**
     * Cancel reservation (user)
     */
    static async cancelReservation(reservationId, userId) {
        const reservation = await ClassroomReservation.findByPk(reservationId);
        if (!reservation) throw ApiError.notFound('Rezervasyon bulunamadı');
        if (reservation.user_id !== userId) throw ApiError.forbidden('Bu rezervasyon size ait değil');
        if (!['pending', 'approved'].includes(reservation.status)) {
            throw ApiError.badRequest('Bu rezervasyon iptal edilemez');
        }

        await reservation.update({ status: 'cancelled' });
        return { message: 'Rezervasyon iptal edildi' };
    }
}

module.exports = ScheduleService;
