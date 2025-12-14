const { CourseSection, Course, User, Classroom } = require('../models');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');

/**
 * Get all sections with filtering
 */
const getSections = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            course_id,
            instructor_id,
            semester,
            year,
            sort_by = 'course_id',
            sort_order = 'ASC'
        } = req.query;

        const offset = (page - 1) * limit;
        const where = {};

        if (course_id) where.course_id = course_id;
        if (instructor_id) where.instructor_id = instructor_id;
        if (semester) where.semester = semester;
        if (year) where.year = year;

        const { count, rows } = await CourseSection.findAndCountAll({
            where,
            include: [
                {
                    model: Course,
                    as: 'course',
                    where: { is_deleted: false },
                    attributes: ['id', 'code', 'name', 'credits']
                },
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Classroom,
                    as: 'classroom',
                    attributes: ['id', 'building', 'room_number']
                }
            ],
            order: [[sort_by, sort_order.toUpperCase()]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                sections: rows,
                pagination: {
                    total: count,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(count / limit)
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Get section by ID
 */
const getSectionById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const section = await CourseSection.findByPk(id, {
            include: [
                {
                    model: Course,
                    as: 'course',
                    attributes: ['id', 'code', 'name', 'credits', 'ects', 'description']
                },
                {
                    model: User,
                    as: 'instructor',
                    attributes: ['id', 'first_name', 'last_name', 'email']
                },
                {
                    model: Classroom,
                    as: 'classroom'
                }
            ]
        });

        if (!section) {
            throw ApiError.notFound('Section bulunamadı');
        }

        res.json({
            success: true,
            data: section
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new section (Admin only)
 */
const createSection = async (req, res, next) => {
    try {
        const {
            course_id,
            section_number,
            semester,
            year,
            instructor_id,
            capacity,
            classroom_id,
            schedule_json
        } = req.body;

        // Verify course exists
        const course = await Course.findOne({ where: { id: course_id, is_deleted: false } });
        if (!course) {
            throw ApiError.notFound('Ders bulunamadı');
        }

        // Check for duplicate section
        const existing = await CourseSection.findOne({
            where: { course_id, section_number, semester, year }
        });
        if (existing) {
            throw ApiError.conflict('Bu section zaten mevcut');
        }

        // Verify instructor is faculty
        const instructor = await User.findOne({
            where: { id: instructor_id, role: 'faculty' }
        });
        if (!instructor) {
            throw ApiError.badRequest('Geçersiz eğitmen');
        }

        const section = await CourseSection.create({
            course_id,
            section_number,
            semester,
            year,
            instructor_id,
            capacity: capacity || 30,
            classroom_id,
            schedule_json: schedule_json || []
        });

        const result = await CourseSection.findByPk(section.id, {
            include: [
                { model: Course, as: 'course', attributes: ['id', 'code', 'name'] },
                { model: User, as: 'instructor', attributes: ['id', 'first_name', 'last_name'] },
                { model: Classroom, as: 'classroom' }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Section başarıyla oluşturuldu',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update section (Admin only)
 */
const updateSection = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { instructor_id, capacity, classroom_id, schedule_json } = req.body;

        const section = await CourseSection.findByPk(id);
        if (!section) {
            throw ApiError.notFound('Section bulunamadı');
        }

        // Verify new instructor if changed
        if (instructor_id && instructor_id !== section.instructor_id) {
            const instructor = await User.findOne({
                where: { id: instructor_id, role: 'faculty' }
            });
            if (!instructor) {
                throw ApiError.badRequest('Geçersiz eğitmen');
            }
        }

        // Validate capacity
        if (capacity && capacity < section.enrolled_count) {
            throw ApiError.badRequest('Kapasite mevcut öğrenci sayısından az olamaz');
        }

        await section.update({
            instructor_id: instructor_id || section.instructor_id,
            capacity: capacity || section.capacity,
            classroom_id: classroom_id !== undefined ? classroom_id : section.classroom_id,
            schedule_json: schedule_json !== undefined ? schedule_json : section.schedule_json
        });

        const result = await CourseSection.findByPk(section.id, {
            include: [
                { model: Course, as: 'course', attributes: ['id', 'code', 'name'] },
                { model: User, as: 'instructor', attributes: ['id', 'first_name', 'last_name'] },
                { model: Classroom, as: 'classroom' }
            ]
        });

        res.json({
            success: true,
            message: 'Section başarıyla güncellendi',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getSections,
    getSectionById,
    createSection,
    updateSection
};
