const analyticsService = require('../services/analyticsService');

/**
 * Analytics Controller
 * Handles all analytics and reporting endpoints
 */

/**
 * GET /analytics/dashboard
 * Get dashboard statistics for admin
 */
exports.getDashboard = async (req, res) => {
    try {
        const stats = await analyticsService.getDashboardStats();
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            error: 'Dashboard istatistikleri alınamadı'
        });
    }
};

/**
 * GET /analytics/academic-performance
 * Get academic performance analytics
 */
exports.getAcademicPerformance = async (req, res) => {
    try {
        const data = await analyticsService.getAcademicPerformance();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Academic performance error:', error);
        res.status(500).json({
            success: false,
            error: 'Akademik performans verileri alınamadı'
        });
    }
};

/**
 * GET /analytics/attendance
 * Get attendance analytics
 */
exports.getAttendance = async (req, res) => {
    try {
        const data = await analyticsService.getAttendanceAnalytics();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Attendance analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Yoklama analitiği alınamadı'
        });
    }
};

/**
 * GET /analytics/meal-usage
 * Get meal usage analytics
 */
exports.getMealUsage = async (req, res) => {
    try {
        const data = await analyticsService.getMealUsageAnalytics();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Meal usage error:', error);
        res.status(500).json({
            success: false,
            error: 'Yemek kullanım verileri alınamadı'
        });
    }
};

/**
 * GET /analytics/events
 * Get event analytics
 */
exports.getEvents = async (req, res) => {
    try {
        const data = await analyticsService.getEventAnalytics();
        res.json({
            success: true,
            data
        });
    } catch (error) {
        console.error('Event analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Etkinlik analitiği alınamadı'
        });
    }
};

/**
 * GET /analytics/export/:type
 * Export reports (Excel, PDF, CSV)
 */
exports.exportReport = async (req, res) => {
    try {
        const { type } = req.params;
        const { format = 'csv' } = req.query;

        let data;
        let filename;

        switch (type) {
            case 'academic':
                data = await analyticsService.getAcademicPerformance();
                filename = `academic_report_${Date.now()}`;
                break;
            case 'attendance':
                data = await analyticsService.getAttendanceAnalytics();
                filename = `attendance_report_${Date.now()}`;
                break;
            case 'meal':
                data = await analyticsService.getMealUsageAnalytics();
                filename = `meal_report_${Date.now()}`;
                break;
            case 'event':
                data = await analyticsService.getEventAnalytics();
                filename = `event_report_${Date.now()}`;
                break;
            default:
                return res.status(400).json({
                    success: false,
                    error: 'Geçersiz rapor tipi. Geçerli tipler: academic, attendance, meal, event'
                });
        }

        // For now, return JSON. In production, would generate actual files
        if (format === 'json') {
            res.json({
                success: true,
                data,
                filename: `${filename}.json`
            });
        } else if (format === 'csv') {
            // Simple CSV export
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);

            // Convert data to CSV format
            const csvData = JSON.stringify(data, null, 2);
            res.send(csvData);
        } else {
            res.json({
                success: true,
                message: 'Export hazırlandı',
                data,
                filename: `${filename}.${format}`
            });
        }
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({
            success: false,
            error: 'Rapor dışa aktarılamadı'
        });
    }
};
