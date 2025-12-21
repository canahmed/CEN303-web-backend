const {
    Event,
    EventRegistration,
    User
} = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const ApiError = require('../utils/ApiError');

class EventService {
    /**
     * Get all events with filters
     */
    static async getEvents({ category, status, startDate, endDate, page = 1, limit = 20 } = {}) {
        const where = {};

        if (category) where.category = category;
        if (status) {
            where.status = status;
        } else {
            where.status = 'published'; // Default to published events
        }

        if (startDate && endDate) {
            where.date = { [Op.between]: [startDate, endDate] };
        } else if (startDate) {
            where.date = { [Op.gte]: startDate };
        } else {
            // Default: upcoming events
            where.date = { [Op.gte]: new Date().toISOString().slice(0, 10) };
        }

        const { rows, count } = await Event.findAndCountAll({
            where,
            include: [
                { model: User, as: 'organizer', attributes: ['id', 'first_name', 'last_name'] }
            ],
            order: [['date', 'ASC'], ['start_time', 'ASC']],
            limit,
            offset: (page - 1) * limit
        });

        return {
            events: rows,
            total: count,
            page,
            limit,
            totalPages: Math.ceil(count / limit)
        };
    }

    /**
     * Get event by ID
     */
    static async getEventById(id) {
        const event = await Event.findByPk(id, {
            include: [
                { model: User, as: 'organizer', attributes: ['id', 'first_name', 'last_name', 'email'] }
            ]
        });
        if (!event) throw ApiError.notFound('Etkinlik bulunamadı');
        return event;
    }

    /**
     * Create event (admin only)
     */
    static async createEvent(data, organizerId) {
        return Event.create({
            ...data,
            organizer_id: organizerId,
            status: data.status || 'draft'
        });
    }

    /**
     * Update event
     */
    static async updateEvent(id, data) {
        const event = await Event.findByPk(id);
        if (!event) throw ApiError.notFound('Etkinlik bulunamadı');
        return event.update(data);
    }

    /**
     * Delete event
     */
    static async deleteEvent(id) {
        const event = await Event.findByPk(id);
        if (!event) throw ApiError.notFound('Etkinlik bulunamadı');

        // Check if there are registrations
        const regCount = await EventRegistration.count({
            where: { event_id: id, status: 'registered' }
        });
        if (regCount > 0) {
            throw ApiError.badRequest('Kayıtlı kullanıcılar var, silinemez');
        }

        await event.destroy();
        return { message: 'Etkinlik silindi' };
    }

    /**
     * Register for event
     */
    static async register(eventId, userId) {
        const event = await Event.findByPk(eventId);
        if (!event) throw ApiError.notFound('Etkinlik bulunamadı');
        if (event.status !== 'published') throw ApiError.badRequest('Etkinlik kayda açık değil');

        // Check registration deadline
        if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
            throw ApiError.badRequest('Kayıt süresi dolmuş');
        }

        // Check if already registered
        const existing = await EventRegistration.findOne({
            where: { event_id: eventId, user_id: userId, status: 'registered' }
        });
        if (existing) throw ApiError.conflict('Zaten bu etkinliğe kayıtlısınız');

        // Check capacity
        if (event.registered_count >= event.capacity) {
            throw ApiError.badRequest('Etkinlik kapasitesi dolu');
        }

        // Generate QR code
        const qrCode = `ER-${uuidv4().slice(0, 8).toUpperCase()}`;

        // Create registration and increment count
        const registration = await EventRegistration.create({
            event_id: eventId,
            user_id: userId,
            qr_code: qrCode,
            status: 'registered'
        });

        await event.increment('registered_count');

        return registration;
    }

    /**
     * Cancel registration
     */
    static async cancelRegistration(eventId, registrationId, userId) {
        const registration = await EventRegistration.findOne({
            where: { id: registrationId, event_id: eventId },
            include: [{ model: Event, as: 'event' }]
        });

        if (!registration) throw ApiError.notFound('Kayıt bulunamadı');
        if (registration.user_id !== userId) throw ApiError.forbidden('Bu kayıt size ait değil');
        if (registration.status !== 'registered') throw ApiError.badRequest('Bu kayıt iptal edilemez');

        await registration.update({ status: 'cancelled' });
        await registration.event.decrement('registered_count');

        return { message: 'Kayıt iptal edildi' };
    }

    /**
     * Get registrations for an event (admin/organizer)
     */
    static async getEventRegistrations(eventId, { page = 1, limit = 50 } = {}) {
        const { rows, count } = await EventRegistration.findAndCountAll({
            where: { event_id: eventId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] }
            ],
            order: [['registration_date', 'ASC']],
            limit,
            offset: (page - 1) * limit
        });

        return {
            registrations: rows,
            total: count,
            page,
            limit
        };
    }

    /**
     * Check-in with QR code
     */
    static async checkIn(eventId, registrationId) {
        const registration = await EventRegistration.findOne({
            where: { id: registrationId, event_id: eventId },
            include: [
                { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
                { model: Event, as: 'event' }
            ]
        });

        if (!registration) throw ApiError.notFound('Kayıt bulunamadı');
        if (registration.status !== 'registered') throw ApiError.badRequest('Geçersiz kayıt durumu');
        if (registration.checked_in) throw ApiError.badRequest('Zaten giriş yapılmış');

        // Check event date
        const today = new Date().toISOString().slice(0, 10);
        if (registration.event.date !== today) {
            throw ApiError.badRequest('Etkinlik bugün değil');
        }

        await registration.update({
            checked_in: true,
            checked_in_at: new Date()
        });

        return {
            message: 'Giriş başarılı',
            user: registration.user,
            event: registration.event.title
        };
    }

    /**
     * Check-in by QR code
     */
    static async checkInByQR(qrCode) {
        const registration = await EventRegistration.findOne({
            where: { qr_code: qrCode },
            include: [
                { model: User, as: 'user', attributes: ['id', 'first_name', 'last_name', 'email'] },
                { model: Event, as: 'event' }
            ]
        });

        if (!registration) throw ApiError.notFound('Geçersiz QR kod');
        if (registration.status !== 'registered') throw ApiError.badRequest('Geçersiz kayıt durumu');
        if (registration.checked_in) throw ApiError.badRequest('Zaten giriş yapılmış');

        await registration.update({
            checked_in: true,
            checked_in_at: new Date()
        });

        return {
            message: 'Giriş başarılı',
            user: registration.user,
            event: registration.event.title
        };
    }

    /**
     * Get my registrations
     */
    static async getMyRegistrations(userId) {
        return EventRegistration.findAll({
            where: { user_id: userId },
            include: [{ model: Event, as: 'event' }],
            order: [[{ model: Event, as: 'event' }, 'date', 'ASC']]
        });
    }
}

module.exports = EventService;
