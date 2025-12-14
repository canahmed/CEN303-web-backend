const Joi = require('joi');

// Create session schema
const createSessionSchema = Joi.object({
    section_id: Joi.number().integer().required()
        .messages({ 'number.base': 'Section ID gerekli' }),
    geofence_radius: Joi.number().integer().min(5).max(100).default(15)
        .messages({ 'number.min': 'Geofence en az 5 metre olmalı' }),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180)
});

// Check-in schema
const checkInSchema = Joi.object({
    latitude: Joi.number().min(-90).max(90).required()
        .messages({ 'number.base': 'Enlem gerekli' }),
    longitude: Joi.number().min(-180).max(180).required()
        .messages({ 'number.base': 'Boylam gerekli' }),
    accuracy: Joi.number().min(0).max(1000).default(0)
        .messages({ 'number.max': 'GPS doğruluğu çok düşük' }),
    qr_code: Joi.string().uuid().optional()
});

// Excuse schema
const excuseSchema = Joi.object({
    session_id: Joi.number().integer().required()
        .messages({ 'number.base': 'Session ID gerekli' }),
    reason: Joi.string().min(10).max(1000).required()
        .messages({
            'string.empty': 'Mazeret açıklaması gerekli',
            'string.min': 'Mazeret en az 10 karakter olmalı'
        })
});

module.exports = {
    createSessionSchema,
    checkInSchema,
    excuseSchema
};
