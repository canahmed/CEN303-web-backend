const { Course, Department, CourseSection, CoursePrerequisite } = require('../models');
const PrerequisiteService = require('../services/prerequisiteService');
const ApiError = require('../utils/ApiError');
const { Op } = require('sequelize');

/**
 * Get all courses with pagination and filtering
 */
const getCourses = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            department_id,
            search,
            sort_by = 'code',
            sort_order = 'ASC'
        } = req.query;

        const offset = (page - 1) * limit;
        const where = { is_deleted: false };

        if (department_id) {
            where.department_id = department_id;
        }

        if (search) {
            where[Op.or] = [
                { code: { [Op.iLike]: `%${search}%` } },
                { name: { [Op.iLike]: `%${search}%` } }
            ];
        }

        const { count, rows } = await Course.findAndCountAll({
            where,
            include: [{
                model: Department,
                as: 'department',
                attributes: ['id', 'name', 'code']
            }],
            order: [[sort_by, sort_order.toUpperCase()]],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            success: true,
            data: {
                courses: rows,
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
 * Get course by ID with prerequisites
 */
const getCourseById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findOne({
            where: { id, is_deleted: false },
            include: [
                {
                    model: Department,
                    as: 'department',
                    attributes: ['id', 'name', 'code']
                },
                {
                    model: Course,
                    as: 'prerequisites',
                    attributes: ['id', 'code', 'name'],
                    through: { attributes: [] }
                }
            ]
        });

        if (!course) {
            throw ApiError.notFound('Ders bulunamadı');
        }

        // Get prerequisite tree
        const prerequisiteTree = await PrerequisiteService.getPrerequisiteTree(course.id);

        res.json({
            success: true,
            data: {
                ...course.toJSON(),
                prerequisiteTree
            }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create new course (Admin only)
 */
const createCourse = async (req, res, next) => {
    try {
        const { code, name, description, credits, ects, syllabus_url, department_id, prerequisite_ids } = req.body;

        // Check if code already exists
        const existing = await Course.findOne({ where: { code } });
        if (existing) {
            throw ApiError.conflict('Bu ders kodu zaten mevcut');
        }

        // Create course
        const course = await Course.create({
            code,
            name,
            description,
            credits,
            ects,
            syllabus_url,
            department_id
        });

        // Add prerequisites if provided
        if (prerequisite_ids && prerequisite_ids.length > 0) {
            const prerequisites = prerequisite_ids.map(prereqId => ({
                course_id: course.id,
                prerequisite_course_id: prereqId
            }));
            await CoursePrerequisite.bulkCreate(prerequisites);
        }

        // Return with associations
        const result = await Course.findByPk(course.id, {
            include: [
                { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
                { model: Course, as: 'prerequisites', attributes: ['id', 'code', 'name'], through: { attributes: [] } }
            ]
        });

        res.status(201).json({
            success: true,
            message: 'Ders başarıyla oluşturuldu',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update course (Admin only)
 */
const updateCourse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { code, name, description, credits, ects, syllabus_url, department_id, prerequisite_ids } = req.body;

        const course = await Course.findByPk(id);
        if (!course || course.is_deleted) {
            throw ApiError.notFound('Ders bulunamadı');
        }

        // Check code uniqueness if changed
        if (code && code !== course.code) {
            const existing = await Course.findOne({ where: { code } });
            if (existing) {
                throw ApiError.conflict('Bu ders kodu zaten mevcut');
            }
        }

        // Update course
        await course.update({
            code: code || course.code,
            name: name || course.name,
            description: description !== undefined ? description : course.description,
            credits: credits || course.credits,
            ects: ects || course.ects,
            syllabus_url: syllabus_url !== undefined ? syllabus_url : course.syllabus_url,
            department_id: department_id || course.department_id
        });

        // Update prerequisites if provided
        if (prerequisite_ids !== undefined) {
            await CoursePrerequisite.destroy({ where: { course_id: course.id } });
            if (prerequisite_ids.length > 0) {
                const prerequisites = prerequisite_ids.map(prereqId => ({
                    course_id: course.id,
                    prerequisite_course_id: prereqId
                }));
                await CoursePrerequisite.bulkCreate(prerequisites);
            }
        }

        const result = await Course.findByPk(course.id, {
            include: [
                { model: Department, as: 'department', attributes: ['id', 'name', 'code'] },
                { model: Course, as: 'prerequisites', attributes: ['id', 'code', 'name'], through: { attributes: [] } }
            ]
        });

        res.json({
            success: true,
            message: 'Ders başarıyla güncellendi',
            data: result
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete course - Soft delete (Admin only)
 */
const deleteCourse = async (req, res, next) => {
    try {
        const { id } = req.params;

        const course = await Course.findByPk(id);
        if (!course || course.is_deleted) {
            throw ApiError.notFound('Ders bulunamadı');
        }

        // Check if course has active sections
        const activeSections = await CourseSection.count({
            where: { course_id: id }
        });

        if (activeSections > 0) {
            throw ApiError.conflict('Bu dersin aktif section\'ları var, silinemez');
        }

        // Soft delete
        await course.update({ is_deleted: true });

        res.json({
            success: true,
            message: 'Ders başarıyla silindi'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse
};
