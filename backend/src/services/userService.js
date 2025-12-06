const { Op } = require('sequelize');
const { User, Student, Faculty, Department } = require('../models');
const { hashPassword, comparePassword } = require('../utils/hash');
const ApiError = require('../utils/ApiError');
const fs = require('fs').promises;
const path = require('path');

/**
 * Get user profile with role-specific data
 */
const getProfile = async (userId) => {
    const user = await User.findByPk(userId, {
        include: [
            {
                model: Student,
                as: 'student',
                include: [{ model: Department, as: 'department' }]
            },
            {
                model: Faculty,
                as: 'faculty',
                include: [{ model: Department, as: 'department' }]
            }
        ]
    });

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    return user.toJSON();
};

/**
 * Update user profile
 */
const updateProfile = async (userId, updateData) => {
    const user = await User.findByPk(userId);

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Update allowed fields
    if (updateData.firstName) user.first_name = updateData.firstName;
    if (updateData.lastName) user.last_name = updateData.lastName;
    if (updateData.phone !== undefined) user.phone = updateData.phone;

    await user.save();

    return user.toJSON();
};

/**
 * Update profile picture
 */
const updateProfilePicture = async (userId, file) => {
    const user = await User.findByPk(userId);

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Delete old profile picture if exists
    if (user.profile_picture_url) {
        const oldPath = path.join(process.cwd(), user.profile_picture_url);
        try {
            await fs.unlink(oldPath);
        } catch (error) {
            // File might not exist, ignore
        }
    }

    // Update with new picture path
    user.profile_picture_url = `/uploads/${file.filename}`;
    await user.save();

    return {
        profilePictureUrl: user.profile_picture_url,
        message: 'Profil fotoğrafı güncellendi'
    };
};

/**
 * Change password
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findByPk(userId);

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password_hash);
    if (!isMatch) {
        throw ApiError.badRequest('Mevcut şifre yanlış');
    }

    // Hash and save new password
    user.password_hash = await hashPassword(newPassword);
    user.refresh_token = null; // Invalidate all sessions
    await user.save();

    return { message: 'Şifreniz başarıyla değiştirildi' };
};

/**
 * Get user list (admin only)
 */
const getUserList = async (queryParams) => {
    const {
        page = 1,
        limit = 10,
        role,
        search,
        departmentId,
        sortBy = 'createdAt',
        sortOrder = 'desc'
    } = queryParams;

    const offset = (page - 1) * limit;

    // Build where clause
    const where = {};

    if (role) {
        where.role = role;
    }

    if (search) {
        where[Op.or] = [
            { first_name: { [Op.iLike]: `%${search}%` } },
            { last_name: { [Op.iLike]: `%${search}%` } },
            { email: { [Op.iLike]: `%${search}%` } }
        ];
    }

    // Build include for department filter
    const include = [];

    if (departmentId) {
        include.push({
            model: Student,
            as: 'student',
            required: false,
            where: { department_id: departmentId },
            include: [{ model: Department, as: 'department' }]
        });
        include.push({
            model: Faculty,
            as: 'faculty',
            required: false,
            where: { department_id: departmentId },
            include: [{ model: Department, as: 'department' }]
        });
    } else {
        include.push({
            model: Student,
            as: 'student',
            required: false,
            include: [{ model: Department, as: 'department' }]
        });
        include.push({
            model: Faculty,
            as: 'faculty',
            required: false,
            include: [{ model: Department, as: 'department' }]
        });
    }

    // Sort field mapping
    const sortFieldMap = {
        createdAt: 'created_at',
        firstName: 'first_name',
        lastName: 'last_name',
        email: 'email'
    };

    const { count, rows } = await User.findAndCountAll({
        where,
        include,
        limit,
        offset,
        order: [[sortFieldMap[sortBy] || 'created_at', sortOrder.toUpperCase()]],
        distinct: true
    });

    return {
        users: rows.map(user => user.toJSON()),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            totalItems: count,
            totalPages: Math.ceil(count / limit)
        }
    };
};

/**
 * Get user by ID (admin only)
 */
const getUserById = async (userId) => {
    const user = await User.findByPk(userId, {
        include: [
            {
                model: Student,
                as: 'student',
                include: [{ model: Department, as: 'department' }]
            },
            {
                model: Faculty,
                as: 'faculty',
                include: [{ model: Department, as: 'department' }]
            }
        ]
    });

    if (!user) {
        throw ApiError.notFound('Kullanıcı bulunamadı');
    }

    return user.toJSON();
};

module.exports = {
    getProfile,
    updateProfile,
    updateProfilePicture,
    changePassword,
    getUserList,
    getUserById
};
