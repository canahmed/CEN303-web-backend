const {
    AttendanceSession, AttendanceRecord, Enrollment,
    CourseSection, Course, Student, Classroom, User
} = require('../models');
const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const ApiError = require('../utils/ApiError');

/**
 * AttendanceService - Attendance management, GPS validation, spoofing detection
 */
class AttendanceService {
    // Constants
    static DEFAULT_GEOFENCE_RADIUS = 15; // meters
    static QR_EXPIRY_MINUTES = 30;
    static ACCURACY_BUFFER = 5; // meters added to geofence for GPS accuracy

    /**
     * Create a new attendance session
     * @param {number} sectionId - Section ID
     * @param {number} instructorId - Instructor ID
     * @param {Object} options - Optional settings
     * @returns {Promise<AttendanceSession>} - Created session
     */
    static async createSession(sectionId, instructorId, options = {}) {
        // Get section and verify instructor
        const section = await CourseSection.findByPk(sectionId, {
            include: [{ model: Classroom, as: 'classroom' }]
        });

        if (!section) {
            throw ApiError.notFound('Section bulunamadı');
        }

        if (section.instructor_id !== instructorId) {
            throw ApiError.forbidden('Bu dersin yoklamasını açma yetkiniz yok');
        }

        // Check for active session
        const activeSession = await AttendanceSession.findOne({
            where: {
                section_id: sectionId,
                status: 'active'
            }
        });

        if (activeSession) {
            throw ApiError.conflict('Bu ders için zaten aktif bir yoklama oturumu var');
        }

        // Get classroom GPS coordinates
        let latitude, longitude;
        if (section.classroom) {
            latitude = section.classroom.latitude;
            longitude = section.classroom.longitude;
        } else if (options.latitude && options.longitude) {
            latitude = options.latitude;
            longitude = options.longitude;
        } else {
            throw ApiError.badRequest('GPS koordinatları gerekli');
        }

        // Generate QR code and expiry
        const qrCode = uuidv4();
        const qrExpiresAt = new Date(Date.now() + this.QR_EXPIRY_MINUTES * 60 * 1000);

        // Create session
        const session = await AttendanceSession.create({
            section_id: sectionId,
            instructor_id: instructorId,
            date: new Date(),
            start_time: new Date().toTimeString().split(' ')[0],
            latitude,
            longitude,
            geofence_radius: options.geofenceRadius || this.DEFAULT_GEOFENCE_RADIUS,
            qr_code: qrCode,
            qr_expires_at: qrExpiresAt,
            status: 'active'
        });

        return AttendanceSession.findByPk(session.id, {
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: Course, as: 'course' }]
            }]
        });
    }

    /**
     * Student check-in to attendance session
     * @param {number} sessionId - Session ID
     * @param {number} studentId - Student ID
     * @param {Object} location - {latitude, longitude, accuracy}
     * @param {string} qrCode - QR code from scan (optional)
     * @returns {Promise<AttendanceRecord>} - Created record
     */
    static async checkIn(sessionId, studentId, location, qrCode = null) {
        const session = await AttendanceSession.findByPk(sessionId);

        if (!session) {
            throw ApiError.notFound('Yoklama oturumu bulunamadı');
        }

        if (session.status !== 'active') {
            throw ApiError.badRequest('Bu yoklama oturumu kapalı');
        }

        // Check QR code if provided
        if (qrCode && qrCode !== session.qr_code) {
            throw ApiError.badRequest('Geçersiz QR kodu');
        }

        // Check QR expiry
        if (session.qr_expires_at && new Date() > session.qr_expires_at) {
            throw ApiError.badRequest('QR kodunun süresi dolmuş');
        }

        // Verify student is enrolled
        const enrollment = await Enrollment.findOne({
            where: {
                student_id: studentId,
                section_id: session.section_id,
                status: 'enrolled'
            }
        });

        if (!enrollment) {
            throw ApiError.forbidden('Bu derse kayıtlı değilsiniz');
        }

        // Check if already checked in
        const existingRecord = await AttendanceRecord.findOne({
            where: {
                session_id: sessionId,
                student_id: studentId
            }
        });

        if (existingRecord) {
            throw ApiError.conflict('Zaten yoklama verildi');
        }

        // Calculate distance from classroom
        const distance = this.calculateDistance(
            location.latitude,
            location.longitude,
            parseFloat(session.latitude),
            parseFloat(session.longitude)
        );

        // Check for spoofing
        const { isFlagged, flagReason } = this.detectSpoofing(
            distance,
            location.accuracy || 0,
            session.geofence_radius
        );

        // Create attendance record
        const record = await AttendanceRecord.create({
            session_id: sessionId,
            student_id: studentId,
            check_in_time: new Date(),
            latitude: location.latitude,
            longitude: location.longitude,
            distance_from_center: distance,
            is_flagged: isFlagged,
            flag_reason: flagReason
        });

        return record;
    }

    /**
     * Calculate distance between two GPS coordinates using Haversine formula
     * @param {number} lat1 - Latitude 1
     * @param {number} lon1 - Longitude 1
     * @param {number} lat2 - Latitude 2
     * @param {number} lon2 - Longitude 2
     * @returns {number} - Distance in meters
     */
    static calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371000; // Earth's radius in meters
        const φ1 = lat1 * Math.PI / 180;
        const φ2 = lat2 * Math.PI / 180;
        const Δφ = (lat2 - lat1) * Math.PI / 180;
        const Δλ = (lon2 - lon1) * Math.PI / 180;

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // Distance in meters
    }

    /**
     * Detect GPS spoofing
     * @param {number} distance - Distance from classroom center
     * @param {number} accuracy - GPS accuracy in meters
     * @param {number} radius - Geofence radius
     * @returns {Object} - {isFlagged, flagReason}
     */
    static detectSpoofing(distance, accuracy, radius) {
        const allowedRadius = radius + this.ACCURACY_BUFFER + (accuracy || 0);

        if (distance > allowedRadius) {
            return {
                isFlagged: true,
                flagReason: `Sınıf dışından yoklama: ${Math.round(distance)}m uzaklık (izin verilen: ${Math.round(allowedRadius)}m)`
            };
        }

        // Suspiciously perfect location (possible mock)
        if (accuracy === 0 || accuracy < 1) {
            return {
                isFlagged: true,
                flagReason: 'Şüpheli GPS doğruluğu'
            };
        }

        return { isFlagged: false, flagReason: null };
    }

    /**
     * Close an attendance session
     * @param {number} sessionId - Session ID
     * @param {number} instructorId - Instructor ID
     * @returns {Promise<AttendanceSession>} - Updated session
     */
    static async closeSession(sessionId, instructorId) {
        const session = await AttendanceSession.findByPk(sessionId);

        if (!session) {
            throw ApiError.notFound('Oturum bulunamadı');
        }

        if (session.instructor_id !== instructorId) {
            throw ApiError.forbidden('Bu oturumu kapatma yetkiniz yok');
        }

        if (session.status !== 'active') {
            throw ApiError.badRequest('Oturum zaten kapalı');
        }

        await session.update({
            status: 'closed',
            end_time: new Date().toTimeString().split(' ')[0]
        });

        return session;
    }

    /**
     * Get attendance statistics for a student in a section
     * @param {number} studentId - Student ID
     * @param {number} sectionId - Section ID
     * @returns {Promise<Object>} - Attendance stats
     */
    static async getAttendanceStats(studentId, sectionId) {
        const totalSessions = await AttendanceSession.count({
            where: {
                section_id: sectionId,
                status: { [Op.in]: ['active', 'closed'] }
            }
        });

        const attendedSessions = await AttendanceRecord.count({
            where: { student_id: studentId },
            include: [{
                model: AttendanceSession,
                as: 'session',
                where: { section_id: sectionId },
                required: true
            }]
        });

        const absenceCount = totalSessions - attendedSessions;
        const attendanceRate = totalSessions > 0 ?
            Math.round((attendedSessions / totalSessions) * 100) : 100;
        const absenceRate = 100 - attendanceRate;

        return {
            totalSessions,
            attendedSessions,
            absenceCount,
            attendanceRate,
            absenceRate,
            status: absenceRate >= 30 ? 'critical' :
                absenceRate >= 20 ? 'warning' : 'ok'
        };
    }

    /**
     * Get student's full attendance summary
     * @param {number} studentId - Student ID
     * @returns {Promise<Array>} - Attendance by course
     */
    static async getStudentAttendance(studentId) {
        const enrollments = await Enrollment.findAll({
            where: {
                student_id: studentId,
                status: 'enrolled'
            },
            include: [{
                model: CourseSection,
                as: 'section',
                include: [{ model: Course, as: 'course' }]
            }]
        });

        const result = [];
        for (const enrollment of enrollments) {
            const stats = await this.getAttendanceStats(studentId, enrollment.section_id);
            result.push({
                courseCode: enrollment.section.course.code,
                courseName: enrollment.section.course.name,
                sectionNumber: enrollment.section.section_number,
                ...stats
            });
        }

        return result;
    }

    /**
     * Get attendance report for a section
     * @param {number} sectionId - Section ID
     * @returns {Promise<Object>} - Full attendance report
     */
    static async getSectionAttendanceReport(sectionId) {
        const section = await CourseSection.findByPk(sectionId, {
            include: [{ model: Course, as: 'course' }]
        });

        if (!section) {
            throw ApiError.notFound('Section bulunamadı');
        }

        const sessions = await AttendanceSession.findAll({
            where: { section_id: sectionId },
            include: [{
                model: AttendanceRecord,
                as: 'records',
                include: [{
                    model: Student,
                    as: 'student',
                    include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }]
                }]
            }],
            order: [['date', 'DESC']]
        });

        const enrollments = await Enrollment.findAll({
            where: { section_id: sectionId, status: 'enrolled' },
            include: [{
                model: Student,
                as: 'student',
                include: [{ model: User, as: 'user', attributes: ['first_name', 'last_name'] }]
            }]
        });

        // Calculate per-student stats
        const studentStats = [];
        for (const enrollment of enrollments) {
            const stats = await this.getAttendanceStats(enrollment.student_id, sectionId);
            studentStats.push({
                studentId: enrollment.student_id,
                studentNumber: enrollment.student.student_number,
                name: `${enrollment.student.user.first_name} ${enrollment.student.user.last_name}`,
                ...stats
            });
        }

        return {
            course: {
                code: section.course.code,
                name: section.course.name,
                sectionNumber: section.section_number
            },
            totalSessions: sessions.length,
            sessions: sessions.map(s => ({
                id: s.id,
                date: s.date,
                startTime: s.start_time,
                endTime: s.end_time,
                status: s.status,
                attendeeCount: s.records.length
            })),
            students: studentStats
        };
    }
}

module.exports = AttendanceService;
