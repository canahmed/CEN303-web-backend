const notificationService = require('../services/notificationService');

/**
 * GET /notifications
 * Get all notifications for current user
 */
exports.getNotifications = async (req, res) => {
    try {
        const { page, limit, type, isRead } = req.query;
        const data = await notificationService.getNotifications(req.user.id, {
            page,
            limit,
            type,
            isRead
        });

        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: 'Bildirimler alınamadı'
        });
    }
};

/**
 * GET /notifications/unread-count
 * Get unread notification count
 */
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await notificationService.getUnreadCount(req.user.id);
        res.json({
            success: true,
            data: { unreadCount: count }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({
            success: false,
            error: 'Okunmamış bildirim sayısı alınamadı'
        });
    }
};

/**
 * PUT /notifications/:id/read
 * Mark a notification as read
 */
exports.markAsRead = async (req, res) => {
    try {
        const notification = await notificationService.markAsRead(
            req.params.id,
            req.user.id
        );

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Bildirim okundu olarak işaretlenemedi'
        });
    }
};

/**
 * PUT /notifications/mark-all-read
 * Mark all notifications as read
 */
exports.markAllAsRead = async (req, res) => {
    try {
        const result = await notificationService.markAllAsRead(req.user.id);
        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            error: 'Tüm bildirimler okundu olarak işaretlenemedi'
        });
    }
};

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
exports.deleteNotification = async (req, res) => {
    try {
        const result = await notificationService.deleteNotification(
            req.params.id,
            req.user.id
        );

        res.json({
            success: true,
            ...result
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(400).json({
            success: false,
            error: error.message || 'Bildirim silinemedi'
        });
    }
};

/**
 * GET /notifications/preferences
 * Get notification preferences
 */
exports.getPreferences = async (req, res) => {
    try {
        const preferences = await notificationService.getPreferences(req.user.id);
        res.json({
            success: true,
            data: preferences
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Bildirim tercihleri alınamadı'
        });
    }
};

/**
 * PUT /notifications/preferences
 * Update notification preferences
 */
exports.updatePreferences = async (req, res) => {
    try {
        const { email_preferences, push_preferences, sms_preferences } = req.body;

        const preferences = await notificationService.updatePreferences(req.user.id, {
            email_preferences,
            push_preferences,
            sms_preferences
        });

        res.json({
            success: true,
            data: preferences
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({
            success: false,
            error: 'Bildirim tercihleri güncellenemedi'
        });
    }
};
