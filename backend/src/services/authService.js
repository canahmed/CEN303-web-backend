const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, Student, Faculty, Department, sequelize } = require('../models');
const { hashPassword, comparePassword } = require('../utils/hash');
const { generateTokens, verifyToken } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('./emailService');
const ApiError = require('../utils/ApiError');

/**
 * Register a new user
 */
const register = async (userData) => {
    const transaction = await sequelize.transaction();

    try {
        // Check if email already exists
        const existingUser = await User.findOne({
            where: { email: userData.email.toLowerCase() }
        });

        if (existingUser) {
            throw ApiError.conflict('Bu email adresi zaten kullanılıyor');
        }

        // Check if department exists
        const department = await Department.findByPk(userData.departmentId);
        if (!department) {
            throw ApiError.badRequest('Geçersiz bölüm');
        }

        // Hash password
        const password_hash = await hashPassword(userData.password);

        // Generate email verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Create user
        const user = await User.create({
            email: userData.email.toLowerCase(),
            password_hash,
            role: userData.role,
            first_name: userData.firstName,
            last_name: userData.lastName,
            phone: userData.phone || null,
            is_active: false,
            email_verification_token: verificationToken,
            email_verification_expires: verificationExpires
        }, { transaction });

        // Create role-specific record
        if (userData.role === 'student') {
            // Check if student number exists
            const existingStudent = await Student.findOne({
                where: { student_number: userData.studentNumber }
            });
            if (existingStudent) {
                throw ApiError.conflict('Bu öğrenci numarası zaten kullanılıyor');
            }

            await Student.create({
                user_id: user.id,
                student_number: userData.studentNumber,
                department_id: userData.departmentId,
                enrollment_year: new Date().getFullYear()
            }, { transaction });
        } else if (userData.role === 'faculty') {
            // Check if employee number exists
            const existingFaculty = await Faculty.findOne({
                where: { employee_number: userData.employeeNumber }
            });
            if (existingFaculty) {
                throw ApiError.conflict('Bu personel numarası zaten kullanılıyor');
            }

            await Faculty.create({
                user_id: user.id,
                employee_number: userData.employeeNumber,
                title: userData.title,
                department_id: userData.departmentId
            }, { transaction });
        }

        await transaction.commit();

        // Send verification email
        try {
            await sendVerificationEmail(
                user.email,
                `${user.first_name} ${user.last_name}`,
                verificationToken
            );
        } catch (emailError) {
            console.error('Email gönderimi başarısız:', emailError.message);
            // Don't throw, user is already created
        }

        return {
            user: user.toJSON(),
            message: 'Kayıt başarılı. Email adresinizi doğrulamak için gelen kutunuzu kontrol edin.'
        };
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
};

/**
 * Verify email with token
 */
const verifyEmail = async (token) => {
    const user = await User.findOne({
        where: {
            email_verification_token: token,
            email_verification_expires: { [Op.gt]: new Date() }
        }
    });

    if (!user) {
        throw ApiError.badRequest('Geçersiz veya süresi dolmuş doğrulama linki');
    }

    user.is_active = true;
    user.email_verification_token = null;
    user.email_verification_expires = null;
    await user.save();

    return { message: 'Email doğrulandı. Şimdi giriş yapabilirsiniz.' };
};

/**
 * Login user
 */
const login = async (email, password) => {
    // Find user
    const user = await User.findOne({
        where: { email: email.toLowerCase() }
    });

    if (!user) {
        throw ApiError.unauthorized('Geçersiz email veya şifre');
    }

    // Check password
    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
        throw ApiError.unauthorized('Geçersiz email veya şifre');
    }

    // Check if email is verified
    if (!user.is_active) {
        throw ApiError.unauthorized('Email adresinizi doğrulamanız gerekiyor');
    }

    // Generate tokens
    const tokens = generateTokens(user);

    // Save refresh token
    user.refresh_token = tokens.refreshToken;
    await user.save();

    return {
        user: user.toJSON(),
        ...tokens
    };
};

/**
 * Refresh access token
 */
const refreshToken = async (refreshToken) => {
    // Verify refresh token
    let decoded;
    try {
        decoded = verifyToken(refreshToken);
    } catch (error) {
        throw ApiError.unauthorized('Geçersiz veya süresi dolmuş refresh token');
    }

    // Find user with this refresh token
    const user = await User.findOne({
        where: {
            id: decoded.id,
            refresh_token: refreshToken
        }
    });

    if (!user) {
        throw ApiError.unauthorized('Geçersiz refresh token');
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token
    user.refresh_token = tokens.refreshToken;
    await user.save();

    return tokens;
};

/**
 * Logout user
 */
const logout = async (userId) => {
    const user = await User.findByPk(userId);

    if (user) {
        user.refresh_token = null;
        await user.save();
    }

    return { message: 'Çıkış başarılı' };
};

/**
 * Request password reset
 */
const forgotPassword = async (email) => {
    const user = await User.findOne({
        where: { email: email.toLowerCase() }
    });

    // Always return success to prevent email enumeration
    if (!user) {
        return { message: 'Eğer email adresiniz kayıtlıysa, şifre sıfırlama linki gönderildi' };
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.password_reset_token = resetToken;
    user.password_reset_expires = resetExpires;
    await user.save();

    // Send reset email
    try {
        await sendPasswordResetEmail(
            user.email,
            `${user.first_name} ${user.last_name}`,
            resetToken
        );
    } catch (emailError) {
        console.error('Email gönderimi başarısız:', emailError.message);
    }

    return { message: 'Eğer email adresiniz kayıtlıysa, şifre sıfırlama linki gönderildi' };
};

/**
 * Reset password with token
 */
const resetPassword = async (token, newPassword) => {
    const user = await User.findOne({
        where: {
            password_reset_token: token,
            password_reset_expires: { [Op.gt]: new Date() }
        }
    });

    if (!user) {
        throw ApiError.badRequest('Geçersiz veya süresi dolmuş sıfırlama linki');
    }

    // Hash new password
    user.password_hash = await hashPassword(newPassword);
    user.password_reset_token = null;
    user.password_reset_expires = null;
    user.refresh_token = null; // Invalidate all sessions
    await user.save();

    return { message: 'Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz.' };
};

module.exports = {
    register,
    verifyEmail,
    login,
    refreshToken,
    logout,
    forgotPassword,
    resetPassword
};
