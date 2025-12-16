const Joi = require('joi');

// Enrollment schemas
const enrollSchema = Joi.object({
    section_id: Joi.alternatives().try(Joi.string().guid(), Joi.number().integer()).required()
        .messages({ 'alternatives.match': 'Section ID geçersiz' })
});

const enrollmentQuerySchema = Joi.object({
    semester: Joi.string().valid('fall', 'spring', 'summer'),
    year: Joi.number().integer().min(2020).max(2100),
    status: Joi.string().valid('enrolled', 'dropped', 'completed', 'failed', 'withdrawn')
});

const manageSectionStudentSchema = Joi.object({
    student_id: Joi.string().guid().required()
        .messages({ 'string.guid': 'Öğrenci ID geçersiz' })
});

module.exports = {
    enrollSchema,
    enrollmentQuerySchema,
    manageSectionStudentSchema
};
