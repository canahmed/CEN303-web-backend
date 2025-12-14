const Joi = require('joi');

// Enrollment schemas
const enrollSchema = Joi.object({
    section_id: Joi.number().integer().required()
        .messages({ 'number.base': 'Section ID gerekli' })
});

const enrollmentQuerySchema = Joi.object({
    semester: Joi.string().valid('fall', 'spring', 'summer'),
    year: Joi.number().integer().min(2020).max(2100),
    status: Joi.string().valid('enrolled', 'dropped', 'completed', 'failed', 'withdrawn')
});

module.exports = {
    enrollSchema,
    enrollmentQuerySchema
};
