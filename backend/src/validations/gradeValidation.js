const Joi = require('joi');

// Grade entry schema
const gradeEntrySchema = Joi.object({
    enrollment_id: Joi.string().uuid().required()
        .messages({ 'string.guid': 'Enrollment ID gerekli', 'any.required': 'Enrollment ID gerekli' }),
    midterm_grade: Joi.number().min(0).max(100).allow(null)
        .messages({
            'number.min': 'Not 0-100 arasında olmalı',
            'number.max': 'Not 0-100 arasında olmalı'
        }),
    final_grade: Joi.number().min(0).max(100).allow(null)
        .messages({
            'number.min': 'Not 0-100 arasında olmalı',
            'number.max': 'Not 0-100 arasında olmalı'
        })
});

// Bulk grade entry schema
const bulkGradeEntrySchema = Joi.object({
    grades: Joi.array().items(
        Joi.object({
            enrollment_id: Joi.string().uuid().required(),
            midterm_grade: Joi.number().min(0).max(100).allow(null),
            final_grade: Joi.number().min(0).max(100).allow(null)
        })
    ).min(1).required()
        .messages({ 'array.min': 'En az bir not girişi gerekli' })
});

module.exports = {
    gradeEntrySchema,
    bulkGradeEntrySchema
};
