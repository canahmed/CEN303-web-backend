const express = require('express');
const router = express.Router();

// Part 1 Routes
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const departmentRoutes = require('./departmentRoutes');

// Part 2 Routes
const courseRoutes = require('./courseRoutes');
const sectionRoutes = require('./sectionRoutes');
const enrollmentRoutes = require('./enrollmentRoutes');
const gradeRoutes = require('./gradeRoutes');
const attendanceRoutes = require('./attendanceRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const classroomRoutes = require('./classroomRoutes');

// Part 3 Routes
const mealRoutes = require('./mealRoutes');
const walletRoutes = require('./walletRoutes');
const eventRoutes = require('./eventRoutes');
const schedulingRoutes = require('./schedulingRoutes');
const reservationRoutes = require('./reservationRoutes');

// Part 4 Routes
const analyticsRoutes = require('./analyticsRoutes');
const notificationRoutes = require('./notificationRoutes');

// Health check endpoint
router.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Smart Campus API is running',
        timestamp: new Date().toISOString()
    });
});

// Mount Part 1 routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);

// Mount Part 2 routes
router.use('/courses', courseRoutes);
router.use('/sections', sectionRoutes);
router.use('/enrollments', enrollmentRoutes);
router.use('/grades', gradeRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/classrooms', classroomRoutes);

// Mount Part 3 routes
router.use('/meals', mealRoutes);
router.use('/wallet', walletRoutes);
router.use('/events', eventRoutes);
router.use('/scheduling', schedulingRoutes);
router.use('/reservations', reservationRoutes);

// Mount Part 4 routes
router.use('/analytics', analyticsRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;


