const Joi = require('joi');

// Password regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

const registerSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Geçerli bir email adresi giriniz',
            'any.required': 'Email zorunludur'
        }),
    password: Joi.string()
        .pattern(passwordRegex)
        .required()
        .messages({
            'string.pattern.base': 'Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir',
            'any.required': 'Şifre zorunludur'
        }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Şifreler eşleşmiyor',
            'any.required': 'Şifre tekrarı zorunludur'
        }),
    firstName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Ad en az 2 karakter olmalıdır',
            'any.required': 'Ad zorunludur'
        }),
    lastName: Joi.string()
        .min(2)
        .max(100)
        .required()
        .messages({
            'string.min': 'Soyad en az 2 karakter olmalıdır',
            'any.required': 'Soyad zorunludur'
        }),
    role: Joi.string()
        .valid('student', 'faculty')
        .required()
        .messages({
            'any.only': 'Geçersiz rol. student veya faculty olmalıdır',
            'any.required': 'Rol zorunludur'
        }),
    phone: Joi.string()
        .pattern(/^[0-9+\-\s()]+$/)
        .optional()
        .allow('')
        .messages({
            'string.pattern.base': 'Geçerli bir telefon numarası giriniz'
        }),
    // Student specific fields
    studentNumber: Joi.when('role', {
        is: 'student',
        then: Joi.string().required().messages({
            'any.required': 'Öğrenci numarası zorunludur'
        }),
        otherwise: Joi.forbidden()
    }),
    // Faculty specific fields
    employeeNumber: Joi.when('role', {
        is: 'faculty',
        then: Joi.string().required().messages({
            'any.required': 'Personel numarası zorunludur'
        }),
        otherwise: Joi.forbidden()
    }),
    title: Joi.when('role', {
        is: 'faculty',
        then: Joi.string().required().messages({
            'any.required': 'Unvan zorunludur'
        }),
        otherwise: Joi.forbidden()
    }),
    // Common fields
    departmentId: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.guid': 'Geçersiz bölüm ID',
            'any.required': 'Bölüm zorunludur'
        })
});

const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Geçerli bir email adresi giriniz',
            'any.required': 'Email zorunludur'
        }),
    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Şifre zorunludur'
        })
});

const verifyEmailSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'any.required': 'Token zorunludur'
        })
});

const forgotPasswordSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Geçerli bir email adresi giriniz',
            'any.required': 'Email zorunludur'
        })
});

const resetPasswordSchema = Joi.object({
    token: Joi.string()
        .required()
        .messages({
            'any.required': 'Token zorunludur'
        }),
    password: Joi.string()
        .pattern(passwordRegex)
        .required()
        .messages({
            'string.pattern.base': 'Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir',
            'any.required': 'Şifre zorunludur'
        }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Şifreler eşleşmiyor',
            'any.required': 'Şifre tekrarı zorunludur'
        })
});

const refreshTokenSchema = Joi.object({
    refreshToken: Joi.string()
        .required()
        .messages({
            'any.required': 'Refresh token zorunludur'
        })
});

module.exports = {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema
};
