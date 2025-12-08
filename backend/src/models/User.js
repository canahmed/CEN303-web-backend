const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const User = sequelize.define('users', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password_hash: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('student', 'faculty', 'admin'),
        allowNull: false,
        defaultValue: 'student'
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    profile_picture_url: {
        type: DataTypes.STRING(500),
        allowNull: true
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // Will be true after email verification
    },
    email_verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    email_verification_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    password_reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['email'] }
    ]
});

// Instance method to get user data without sensitive fields
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.email_verification_token;
    delete values.password_reset_token;
    delete values.refresh_token;
    return values;
};

module.exports = User;
