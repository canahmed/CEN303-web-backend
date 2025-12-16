const Joi = require('joi');

// Course validation schemas
const createCourseSchema = Joi.object({
    code: Joi.string().min(3).max(20).required()
        .messages({
            'string.empty': 'Ders kodu gerekli',
            'string.min': 'Ders kodu en az 3 karakter olmalı',
            'string.max': 'Ders kodu en fazla 20 karakter olabilir'
        }),
    name: Joi.string().min(3).max(200).required()
        .messages({
            'string.empty': 'Ders adı gerekli',
            'string.min': 'Ders adı en az 3 karakter olmalı'
        }),
    description: Joi.string().max(2000).allow('', null),
    credits: Joi.number().integer().min(1).max(10).required()
        .messages({
            'number.base': 'Kredi sayısı gerekli',
            'number.min': 'Kredi en az 1 olmalı',
            'number.max': 'Kredi en fazla 10 olabilir'
        }),
    ects: Joi.number().integer().min(1).max(30).required()
        .messages({
            'number.base': 'ECTS gerekli',
            'number.min': 'ECTS en az 1 olmalı'
        }),
    syllabus_url: Joi.string().uri().allow('', null),
    department_id: Joi.alternatives().try(
        Joi.string().guid(),
        Joi.number().integer()
    ).messages({
        'alternatives.match': 'Bölüm ID geçersiz'
    }),
    departmentId: Joi.alternatives().try(
        Joi.string().guid(),
        Joi.number().integer()
    ).messages({
        'alternatives.match': 'Bölüm ID geçersiz'
    }),
    prerequisite_ids: Joi.array()
        .items(Joi.alternatives().try(Joi.string().guid(), Joi.number().integer()))
        .messages({
            'alternatives.match': 'Önkoşul ID geçersiz'
        })
}).or('department_id', 'departmentId');

const updateCourseSchema = Joi.object({
    code: Joi.string().min(3).max(20),
    name: Joi.string().min(3).max(200),
    description: Joi.string().max(2000).allow('', null),
    credits: Joi.number().integer().min(1).max(10),
    ects: Joi.number().integer().min(1).max(30),
    syllabus_url: Joi.string().uri().allow('', null),
    department_id: Joi.alternatives().try(
        Joi.string().guid(),
        Joi.number().integer()
    ).messages({
        'alternatives.match': 'Bölüm ID geçersiz'
    }),
    departmentId: Joi.alternatives().try(
        Joi.string().guid(),
        Joi.number().integer()
    ).messages({
        'alternatives.match': 'Bölüm ID geçersiz'
    }),
    prerequisite_ids: Joi.array()
        .items(Joi.alternatives().try(Joi.string().guid(), Joi.number().integer()))
        .messages({
            'alternatives.match': 'Önkoşul ID geçersiz'
        })
}).min(1);

const courseQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(10),
    department_id: Joi.string().guid(),
    search: Joi.string().max(100),
    sort_by: Joi.string().valid('code', 'name', 'credits', 'created_at').default('code'),
    sort_order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC')
});

// Section validation schemas
const scheduleItemSchema = Joi.object({
    day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
    start_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    end_time: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).required()
});

const createSectionSchema = Joi.object({
    course_id: Joi.string().guid().required()
        .messages({ 'any.required': 'Ders ID gerekli', 'string.guid': 'Ders ID geçersiz' }),
    section_number: Joi.string().max(10).default('01'),
    semester: Joi.string().valid('fall', 'spring', 'summer').required()
        .messages({ 'any.only': 'Dönem fall, spring veya summer olmalı' }),
    year: Joi.number().integer().min(2020).max(2100).required()
        .messages({ 'number.base': 'Yıl gerekli' }),
    instructor_id: Joi.string().guid().required()
        .messages({ 'any.required': 'Eğitmen ID gerekli', 'string.guid': 'Eğitmen ID geçersiz' }),
    capacity: Joi.number().integer().min(1).max(500).default(30),
    classroom_id: Joi.string().guid().allow(null, ''),
    schedule_json: Joi.array().items(scheduleItemSchema).default([])
});

const updateSectionSchema = Joi.object({
    instructor_id: Joi.string().guid()
        .messages({ 'string.guid': 'Eğitmen ID geçersiz' }),
    capacity: Joi.number().integer().min(1).max(500),
    classroom_id: Joi.string().guid().allow(null, ''),
    schedule_json: Joi.array().items(scheduleItemSchema)
}).min(1);

const sectionQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    course_id: Joi.string().guid(),
    instructor_id: Joi.string().guid(),
    semester: Joi.string().valid('fall', 'spring', 'summer'),
    year: Joi.number().integer().min(2020).max(2100),
    sort_by: Joi.string().valid('course_id', 'section_number', 'year', 'created_at').default('course_id'),
    sort_order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('ASC')
});

module.exports = {
    createCourseSchema,
    updateCourseSchema,
    courseQuerySchema,
    createSectionSchema,
    updateSectionSchema,
    sectionQuerySchema
};
