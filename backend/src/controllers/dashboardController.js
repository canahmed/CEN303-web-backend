const DashboardService = require('../services/dashboardService');

/**
 * GET /api/v1/dashboard
 * Returns role-based dashboard summary
 */
const getDashboard = async (req, res, next) => {
    try {
        const dashboard = await DashboardService.getDashboard(req.user);

        res.json({
            success: true,
            data: dashboard
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getDashboard
};
