const express = require('express');
const router = express.Router();
const { Department } = require('../models');

/**
 * @route   GET /api/v1/departments
 * @desc    Get all departments
 * @access  Public
 */
router.get('/', async (req, res, next) => {
    try {
        const departments = await Department.findAll({
            attributes: ['id', 'name', 'code', 'faculty'],
            order: [['name', 'ASC']]
        });

        res.status(200).json({
            success: true,
            data: departments
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
