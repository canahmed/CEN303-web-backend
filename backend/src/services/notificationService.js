const { Notification, NotificationPreferences, User } = require('../models');
const { Op } = require('sequelize');

class NotificationService {
    /**
     * Get all notifications for a user with pagination
     */
    async getNotifications(userId, options = {}) {
        const { page = 1, limit = 20, type, isRead } = options;
        const offset = (page - 1) * limit;

        const where = { user_id: userId };

        if (type) {
            where.type = type;
        }

        if (isRead !== undefined) {
            where.is_read = isRead === 'true' || isRead === true;
        }

        const { count, rows } = await Notification.findAndCountAll({
            where,
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset
        });

        return {
            notifications: rows,
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
        };
    }

    /**
     * Get unread notification count
     */
    async getUnreadCount(userId) {
        const count = await Notification.count({
            where: {
                user_id: userId,
                is_read: false
            }
        });
        return count;
    }

    /**
     * Mark a notification as read
     */
    async markAsRead(notificationId, userId) {
        const notification = await Notification.findOne({
            where: { id: notificationId, user_id: userId }
        });

        if (!notification) {
            throw new Error('Bildirim bulunamadı');
        }

        notification.is_read = true;
        notification.read_at = new Date();
        await notification.save();

        return notification;
    }

    /**
     * Mark all notifications as read
     */
    async markAllAsRead(userId) {
        await Notification.update(
            { is_read: true, read_at: new Date() },
            { where: { user_id: userId, is_read: false } }
        );

        return { message: 'Tüm bildirimler okundu olarak işaretlendi' };
    }

    /**
     * Delete a notification
     */
    async deleteNotification(notificationId, userId) {
        const notification = await Notification.findOne({
            where: { id: notificationId, user_id: userId }
        });

        if (!notification) {
            throw new Error('Bildirim bulunamadı');
        }

        await notification.destroy();
        return { message: 'Bildirim silindi' };
    }

    /**
     * Get notification preferences
     */
    async getPreferences(userId) {
        let preferences = await NotificationPreferences.findOne({
            where: { user_id: userId }
        });

        // Create default preferences if not exist
        if (!preferences) {
            preferences = await NotificationPreferences.create({
                user_id: userId
            });
        }

        return preferences;
    }

    /**
     * Update notification preferences
     */
    async updatePreferences(userId, preferencesData) {
        let preferences = await NotificationPreferences.findOne({
            where: { user_id: userId }
        });

        if (!preferences) {
            preferences = await NotificationPreferences.create({
                user_id: userId,
                ...preferencesData
            });
        } else {
            if (preferencesData.email_preferences) {
                preferences.email_preferences = {
                    ...preferences.email_preferences,
                    ...preferencesData.email_preferences
                };
            }
            if (preferencesData.push_preferences) {
                preferences.push_preferences = {
                    ...preferences.push_preferences,
                    ...preferencesData.push_preferences
                };
            }
            if (preferencesData.sms_preferences) {
                preferences.sms_preferences = {
                    ...preferences.sms_preferences,
                    ...preferencesData.sms_preferences
                };
            }
            await preferences.save();
        }

        return preferences;
    }

    /**
     * Create a notification (for internal use)
     */
    async createNotification(userId, data) {
        const notification = await Notification.create({
            user_id: userId,
            type: data.type || 'system',
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata
        });

        return notification;
    }

    /**
     * Send notification to multiple users (batch)
     */
    async sendBulkNotification(userIds, data) {
        const notifications = userIds.map(userId => ({
            user_id: userId,
            type: data.type || 'system',
            title: data.title,
            message: data.message,
            link: data.link,
            metadata: data.metadata
        }));

        await Notification.bulkCreate(notifications);
        return { message: `${userIds.length} kullanıcıya bildirim gönderildi` };
    }
}

module.exports = new NotificationService();
