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
            notifications: rows.map(n => ({
                id: n.id,
                userId: n.user_id,
                type: n.type,
                title: n.title,
                message: n.message,
                actionUrl: n.link,
                isRead: n.is_read,
                readAt: n.read_at,
                metadata: n.metadata,
                createdAt: n.created_at,
                updatedAt: n.updated_at
            })),
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: count,
                totalPages: Math.ceil(count / limit)
            }
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

        return {
            id: notification.id,
            userId: notification.user_id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.link,
            isRead: notification.is_read,
            readAt: notification.read_at,
            metadata: notification.metadata,
            createdAt: notification.created_at,
            updatedAt: notification.updated_at
        };
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
     * Respects user notification preferences
     */
    async createNotification(userId, data) {
        const type = data.type || 'system';
        
        // Get user preferences to check if they want this notification
        const preferences = await this.getPreferences(userId);
        
        // Check if user wants push/in-app notifications for this type
        const wantsPush = preferences.push_preferences?.[type] !== false;
        
        if (!wantsPush && !data.force) {
            // User disabled this notification type, skip creating
            return null;
        }

        const notification = await Notification.create({
            user_id: userId,
            type: type,
            title: data.title,
            message: data.message,
            link: data.link || data.actionUrl,
            metadata: data.metadata
        });

        // TODO: If email preference enabled, send email
        // const wantsEmail = preferences.email_preferences?.[type] !== false;
        // if (wantsEmail && data.sendEmail) {
        //     await emailService.sendNotificationEmail(userId, notification);
        // }

        return {
            id: notification.id,
            userId: notification.user_id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            actionUrl: notification.link,
            isRead: notification.is_read,
            metadata: notification.metadata,
            createdAt: notification.created_at
        };
    }

    /**
     * Send notification to multiple users (batch)
     * Respects user notification preferences
     */
    async sendBulkNotification(userIds, data) {
        const type = data.type || 'system';
        
        // Get all user preferences at once for efficiency
        const allPreferences = await NotificationPreferences.findAll({
            where: { user_id: userIds }
        });
        
        const preferencesMap = new Map(
            allPreferences.map(p => [p.user_id, p])
        );
        
        // Filter users who want this notification type
        const eligibleUserIds = userIds.filter(userId => {
            const prefs = preferencesMap.get(userId);
            // If no preferences, default to true (send notification)
            if (!prefs) return true;
            return prefs.push_preferences?.[type] !== false;
        });
        
        if (eligibleUserIds.length === 0) {
            return { message: 'Hiçbir kullanıcı bu bildirim tipini almak istemiyor', sent: 0 };
        }

        const notifications = eligibleUserIds.map(userId => ({
            user_id: userId,
            type: type,
            title: data.title,
            message: data.message,
            link: data.link || data.actionUrl,
            metadata: data.metadata
        }));

        await Notification.bulkCreate(notifications);
        return { 
            message: `${eligibleUserIds.length} kullanıcıya bildirim gönderildi`,
            sent: eligibleUserIds.length,
            skipped: userIds.length - eligibleUserIds.length
        };
    }
}

module.exports = new NotificationService();
