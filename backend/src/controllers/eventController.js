const EventService = require('../services/eventService');
const ApiError = require('../utils/ApiError');

// ==========================================
// Event Controllers
// ==========================================

/**
 * GET /api/v1/events
 * Get events with filters
 */
const getEvents = async (req, res, next) => {
    try {
        const { category, status, start_date, end_date, page, limit } = req.query;
        const result = await EventService.getEvents({
            category,
            status: req.user.role === 'admin' ? status : 'published',
            startDate: start_date,
            endDate: end_date,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20
        });
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/events/:id
 * Get event by ID
 */
const getEventById = async (req, res, next) => {
    try {
        const event = await EventService.getEventById(req.params.id);
        res.json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/events
 * Create event (admin only)
 */
const createEvent = async (req, res, next) => {
    try {
        const event = await EventService.createEvent(req.body, req.user.id);
        res.status(201).json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

/**
 * PUT /api/v1/events/:id
 * Update event (admin only)
 */
const updateEvent = async (req, res, next) => {
    try {
        const event = await EventService.updateEvent(req.params.id, req.body);
        res.json({ success: true, data: event });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/events/:id
 * Delete event (admin only)
 */
const deleteEvent = async (req, res, next) => {
    try {
        await EventService.deleteEvent(req.params.id);
        res.status(204).send();
    } catch (error) {
        next(error);
    }
};

// ==========================================
// Registration Controllers
// ==========================================

/**
 * POST /api/v1/events/:id/register
 * Register for event
 */
const register = async (req, res, next) => {
    try {
        const registration = await EventService.register(req.params.id, req.user.id);
        res.status(201).json({
            success: true,
            message: 'Etkinliğe kayıt oldunuz',
            data: registration
        });
    } catch (error) {
        next(error);
    }
};

/**
 * DELETE /api/v1/events/:eventId/registrations/:regId
 * Cancel registration
 */
const cancelRegistration = async (req, res, next) => {
    try {
        await EventService.cancelRegistration(req.params.eventId, req.params.regId, req.user.id);
        res.json({ success: true, message: 'Kayıt iptal edildi' });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/events/:id/registrations
 * Get event registrations (admin/organizer)
 */
const getEventRegistrations = async (req, res, next) => {
    try {
        const { page, limit } = req.query;
        const result = await EventService.getEventRegistrations(req.params.id, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50
        });
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/events/:eventId/registrations/:regId/checkin
 * Check-in with registration ID
 */
const checkIn = async (req, res, next) => {
    try {
        const result = await EventService.checkIn(req.params.eventId, req.params.regId);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * POST /api/v1/events/checkin/:qrCode
 * Check-in with QR code
 */
const checkInByQR = async (req, res, next) => {
    try {
        const result = await EventService.checkInByQR(req.params.qrCode);
        res.json({ success: true, ...result });
    } catch (error) {
        next(error);
    }
};

/**
 * GET /api/v1/events/my-registrations
 * Get my event registrations
 */
const getMyRegistrations = async (req, res, next) => {
    try {
        const registrations = await EventService.getMyRegistrations(req.user.id);
        res.json({ success: true, data: registrations });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    register,
    cancelRegistration,
    getEventRegistrations,
    checkIn,
    checkInByQR,
    getMyRegistrations
};
