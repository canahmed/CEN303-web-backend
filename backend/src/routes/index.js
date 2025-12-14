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

module.exports = router;
