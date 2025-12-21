const { Student, Faculty, ExcuseRequest, AttendanceSession, CourseSection } = require('../models');
const AttendanceService = require('../services/attendanceService');
const ApiError = require('../utils/ApiError');

// ============================================
// SESSION ENDPOINTS (Faculty)
// ============================================

/**
 * Create attendance session
 */
const createSession = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let { section_id, geofence_radius, latitude, longitude } = req.body;

        // If section_id is not UUID, try to find by section code or course code
        if (section_id && !isValidUUID(section_id)) {
            const section = await CourseSection.findOne({
                where: {},
                include: [{
                    model: require('../models').Course,
                    as: 'course',
                    where: { code: section_id }
                }]
            });

            if (!section) {
                // Try finding by section number pattern like "CEN303-01"
                const parts = section_id.split('-');
                if (parts.length === 2) {
                    const courseCode = parts[0];
                    const sectionNum = parseInt(parts[1]);
                    const sectionByCode = await CourseSection.findOne({
                        where: { section_number: sectionNum },
                        include: [{
                            model: require('../models').Course,
                            as: 'course',
                            where: { code: courseCode }
                        }]
                    });
                    if (sectionByCode) {
                        section_id = sectionByCode.id;
                    }
                }
            } else {
                section_id = section.id;
            }
        }

        const session = await AttendanceService.createSession(section_id, userId, {
            geofenceRadius: geofence_radius,
            latitude,
            longitude
        });

        res.status(201).json({
            success: true,
            message: 'Yoklama oturumu oluşturuldu',
            data: session
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to validate UUID
function isValidUUID(str) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
}

/**
 * Get session details
 */
const getSession = async (req, res, next) => {
    try {
        const { id } = req.params;

        const session = await AttendanceSession.findByPk(id, {
            include: [
                { model: CourseSection, as: 'section', include: ['course'] },
                { model: require('../models').AttendanceRecord, as: 'records', include: ['student'] }
            ]
        });

        if (!session) {
            throw ApiError.notFound('Oturum bulunamadı');
        }

        res.json({
            success: true,
            data: session
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Close session
 */
const closeSession = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const session = await AttendanceService.closeSession(id, userId);

        res.json({
            success: true,
            message: 'Oturum kapatıldı',
            data: session
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my sessions (Faculty)
 */
const getMySessions = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { section_id, status, limit = 20 } = req.query;

        const where = { instructor_id: userId };
        if (section_id) where.section_id = section_id;
        if (status) where.status = status;

        const sessions = await AttendanceSession.findAll({
            where,
            include: [{ model: CourseSection, as: 'section', include: ['course'] }],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit)
        });

        res.json({
            success: true,
            data: sessions
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get attendance report for section
 */
const getAttendanceReport = async (req, res, next) => {
    try {
        const { sectionId } = req.params;

        const report = await AttendanceService.getSectionAttendanceReport(parseInt(sectionId));

        res.json({
            success: true,
            data: report
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// STUDENT CHECK-IN ENDPOINTS
// ============================================

/**
 * Student check-in
 */
const checkIn = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { latitude, longitude, accuracy, qr_code } = req.body;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler yoklama verebilir');
        }

        const record = await AttendanceService.checkIn(
            parseInt(id),
            student.id,
            { latitude, longitude, accuracy },
            qr_code
        );

        res.status(201).json({
            success: true,
            message: record.is_flagged ?
                'Yoklama verildi (şüpheli konum tespit edildi)' :
                'Yoklama başarıyla verildi',
            data: record
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get my attendance
 */
const getMyAttendance = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler bu endpoint\'i kullanabilir');
        }

        const attendance = await AttendanceService.getStudentAttendance(student.id);

        res.json({
            success: true,
            data: attendance
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get active sessions for enrolled courses (Student)
 */
const getMyActiveSessions = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler bu endpoint\'i kullanabilir');
        }

        const activeSessions = await AttendanceService.getActiveSessionsForStudent(student.id);

        res.json({
            success: true,
            data: activeSessions
        });
    } catch (error) {
        next(error);
    }
};

// ============================================
// EXCUSE REQUEST ENDPOINTS
// ============================================

/**
 * Submit excuse request
 */
const submitExcuse = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { session_id, reason } = req.body;
        const document = req.file;

        const student = await Student.findOne({ where: { user_id: userId } });
        if (!student) {
            throw ApiError.forbidden('Sadece öğrenciler mazeret bildirebilir');
        }

        // Verify session exists
        const session = await AttendanceSession.findByPk(session_id);
        if (!session) {
            throw ApiError.notFound('Yoklama oturumu bulunamadı');
        }

        const excuse = await ExcuseRequest.create({
            student_id: student.id,
            session_id,
            reason,
            document_url: document ? `/uploads/excuses/${document.filename}` : null,
            status: 'pending'
        });

        res.status(201).json({
            success: true,
            message: 'Mazeret bildirimi gönderildi',
            data: excuse
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get excuse requests (Faculty)
 */
const getExcuseRequests = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { status, section_id } = req.query;

        const where = {};
        if (status) where.status = status;

        // Get sections taught by this faculty
        const sections = await CourseSection.findAll({
            where: { instructor_id: userId },
            attributes: ['id']
        });
        const sectionIds = sections.map(s => s.id);

        if (section_id) {
            if (!sectionIds.includes(parseInt(section_id))) {
                throw ApiError.forbidden('Bu section sizin dersiniz değil');
            }
        }

        const excuses = await ExcuseRequest.findAll({
            where,
            include: [
                {
                    model: AttendanceSession,
                    as: 'session',
                    where: section_id ? { section_id } : { section_id: { [require('sequelize').Op.in]: sectionIds } },
                    required: true,
                    include: [{ model: CourseSection, as: 'section', include: ['course'] }]
                },
                {
                    model: Student,
                    as: 'student',
                    include: [{ model: require('../models').User, as: 'user', attributes: ['first_name', 'last_name'] }]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json({
            success: true,
            data: excuses
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve excuse request
 */
const approveExcuse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { notes } = req.body;

        const excuse = await ExcuseRequest.findByPk(id, {
            include: [{ model: AttendanceSession, as: 'session' }]
        });

        if (!excuse) {
            throw ApiError.notFound('Mazeret bulunamadı');
        }

        // Verify instructor owns this section
        const section = await CourseSection.findByPk(excuse.session.section_id);
        if (section.instructor_id !== userId) {
            throw ApiError.forbidden('Bu mazereti onaylama yetkiniz yok');
        }

        await excuse.update({
            status: 'approved',
            reviewed_by: userId,
            reviewed_at: new Date(),
            notes
        });

        res.json({
            success: true,
            message: 'Mazeret onaylandı',
            data: excuse
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Reject excuse request
 */
const rejectExcuse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const { notes } = req.body;

        const excuse = await ExcuseRequest.findByPk(id, {
            include: [{ model: AttendanceSession, as: 'session' }]
        });

        if (!excuse) {
            throw ApiError.notFound('Mazeret bulunamadı');
        }

        const section = await CourseSection.findByPk(excuse.session.section_id);
        if (section.instructor_id !== userId) {
            throw ApiError.forbidden('Bu mazereti reddetme yetkiniz yok');
        }

        await excuse.update({
            status: 'rejected',
            reviewed_by: userId,
            reviewed_at: new Date(),
            notes
        });

        res.json({
            success: true,
            message: 'Mazeret reddedildi',
            data: excuse
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // Sessions
    createSession,
    getSession,
    closeSession,
    getMySessions,
    getAttendanceReport,
    // Check-in
    checkIn,
    getMyAttendance,
    getMyActiveSessions,
    // Excuses
    submitExcuse,
    getExcuseRequests,
    approveExcuse,
    rejectExcuse
};
