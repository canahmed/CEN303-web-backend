const ScheduleService = require('../services/scheduleService');
const ApiError = require('../utils/ApiError');

// ==========================================
// Schedule Controllers
// ==========================================

/**
 * GET /api/v1/scheduling/my-schedule
 * Get my weekly schedule
 */
const getMySchedule = async (req, res, next) => {
    try {
        const schedule = await ScheduleService.getMySchedule(req.user.id, req.user.role);
        res.json({ success: true, data: schedule });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/scheduling/my-schedule/ical
 * Download iCal file
 */
const getMyScheduleICal = async (req, res, next) => {
    try {
        const ical = await ScheduleService.generateICal(req.user.id, req.user.role);
        res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="schedule.ics"');
        res.send(ical);
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Reservation Controllers
// ==========================================

/**
 * POST /api/v1/reservations
 * Create classroom reservation
 */
const createReservation = async (req, res, next) => {
    try {
        const reservation = await ScheduleService.createReservation(req.user.id, req.body);
        res.status(201).json({
            success: true,
            message: 'Rezervasyon talebi oluşturuldu',
            data: reservation
        });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/reservations
 * Get reservations
 */
const getReservations = async (req, res, next) => {
    try {
        const { classroom_id, date, status, page, limit } = req.query;

        // Non-admin users can only see their own reservations
        const userId = req.user.role === 'admin' ? undefined : req.user.id;

        const result = await ScheduleService.getReservations({
            classroomId: classroom_id,
            date,
            status,
            userId,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/reservations/my
 * Get my reservations
 */
const getMyReservations = async (req, res, next) => {
    try {
        const { status, page, limit } = req.query;
        const result = await ScheduleService.getReservations({
            userId: req.user.id,
            status,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/reservations/:id/approve
 * Approve reservation (admin only)
 */
const approveReservation = async (req, res, next) => {
    try {
        await ScheduleService.approveReservation(req.params.id, req.user.id);
        res.json({ success: true, message: 'Rezervasyon onaylandı' });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/reservations/:id/reject
 * Reject reservation (admin only)
 */
const rejectReservation = async (req, res, next) => {
    try {
        const { reason } = req.body;
        await ScheduleService.rejectReservation(req.params.id, req.user.id, reason);
        res.json({ success: true, message: 'Rezervasyon reddedildi' });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/reservations/:id
 * Cancel reservation
 */
const cancelReservation = async (req, res, next) => {
    try {
        await ScheduleService.cancelReservation(req.params.id, req.user.id);
        res.json({ success: true, message: 'Rezervasyon iptal edildi' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getMySchedule,
    getMyScheduleICal,
    createReservation,
    getReservations,
    getMyReservations,
    approveReservation,
    rejectReservation,
    cancelReservation
};
