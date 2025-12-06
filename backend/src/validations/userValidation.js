const Joi = require('joi');

const updateProfileSchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
            'string.min': 'Ad en az 2 karakter olmalıdır'
        }),
    lastName: Joi.string()
        .min(2)
        .max(100)
        .optional()
        .messages({
            'string.min': 'Soyad en az 2 karakter olmalıdır'
        }),
    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]+$/)
        .optional()
        .allow('')
        .messages({
            'string.pattern.base': 'Geçerli bir telefon numarası giriniz'
        })
}).min(1).messages({
    'object.min': 'En az bir alan güncellenmelidir'
});

const changePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            'any.required': 'Mevcut şifre zorunludur'
        }),
    newPassword: Joi.string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/)
        .required()
        .messages({
            'string.pattern.base': 'Yeni şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir',
            'any.required': 'Yeni şifre zorunludur'
        }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Şifreler eşleşmiyor',
            'any.required': 'Şifre tekrarı zorunludur'
        })
});

const userListQuerySchema = Joi.object({
    page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
            'number.min': 'Sayfa numarası en az 1 olmalıdır'
        }),
    limit: Joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(10)
        .messages({
            'number.min': 'Limit en az 1 olmalıdır',
            'number.max': 'Limit en fazla 100 olabilir'
        }),
    role: Joi.string()
        .valid('student', 'faculty', 'admin')
        .optional()
        .messages({
            'any.only': 'Geçersiz rol'
        }),
    search: Joi.string()
        .optional()
        .allow(''),
    departmentId: Joi.string()
        .uuid()
        .optional()
        .messages({
            'string.guid': 'Geçersiz bölüm ID'
        }),
    sortBy: Joi.string()
        .valid('createdAt', 'firstName', 'lastName', 'email')
        .default('createdAt'),
    sortOrder: Joi.string()
        .valid('asc', 'desc')
        .default('desc')
});

module.exports = {
    updateProfileSchema,
    changePasswordSchema,
    userListQuerySchema
};
