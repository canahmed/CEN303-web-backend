const { Course, CoursePrerequisite, Enrollment, CourseSection } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * PrerequisiteService - Recursive prerequisite checking
 */
class PrerequisiteService {
    /**
     * Check if student has completed all prerequisites for a course
     * @param {number} courseId - The course to check prerequisites for
     * @param {number} studentId - The student ID
     * @param {Set} visited - Set of visited course IDs (for cycle detection)
     * @returns {Promise<{met: boolean, missing: Array}>} - Result with missing prerequisites
     */
    static async checkPrerequisites(courseId, studentId, visited = new Set()) {
        // Cycle detection
        if (visited.has(courseId)) {
            return { met: true, missing: [] };
        }
        visited.add(courseId);

        // Get direct prerequisites
        const prerequisites = await CoursePrerequisite.findAll({
            where: { course_id: courseId },
            include: [{
                model: Course,
                as: 'prerequisite',
                attributes: ['id', 'code', 'name']
            }]
        });

        const missing = [];

        for (const prereq of prerequisites) {
            const prereqCourseId = prereq.prerequisite_course_id;

            // Check if student has completed this prerequisite
            const completed = await this.hasCompletedCourse(studentId, prereqCourseId);

            if (!completed) {
                const course = await Course.findByPk(prereqCourseId, {
                    attributes: ['id', 'code', 'name']
                });
                missing.push({
                    courseId: prereqCourseId,
                    code: course?.code,
                    name: course?.name
                });
            }

            // Recursive check for nested prerequisites
            const nestedResult = await this.checkPrerequisites(prereqCourseId, studentId, visited);
            if (!nestedResult.met) {
                missing.push(...nestedResult.missing);
            }
        }

        // Remove duplicates
        const uniqueMissing = missing.filter((item, index, self) =>
            index === self.findIndex((t) => t.courseId === item.courseId)
        );

        return {
            met: uniqueMissing.length === 0,
            missing: uniqueMissing
        };
    }

    /**
     * Check if student has completed a specific course
     * @param {number} studentId - Student ID
     * @param {number} courseId - Course ID
     * @returns {Promise<boolean>} - True if completed
     */
    static async hasCompletedCourse(studentId, courseId) {
        const enrollment = await Enrollment.findOne({
            where: {
                student_id: studentId,
                status: 'completed'
            },
            include: [{
                model: CourseSection,
                as: 'section',
                where: { course_id: courseId },
                required: true
            }]
        });

        return enrollment !== null;
    }

    /**
     * Get all prerequisites for a course (flat list)
     * @param {number} courseId - Course ID
     * @returns {Promise<Array>} - List of prerequisite courses
     */
    static async getAllPrerequisites(courseId) {
        const course = await Course.findByPk(courseId, {
            include: [{
                model: Course,
                as: 'prerequisites',
                attributes: ['id', 'code', 'name'],
                through: { attributes: [] }
            }]
        });

        return course?.prerequisites || [];
    }

    /**
     * Get prerequisite tree (nested structure)
     * @param {number} courseId - Course ID
     * @param {Set} visited - Visited set for cycle detection
     * @returns {Promise<Object>} - Nested prerequisite tree
     */
    static async getPrerequisiteTree(courseId, visited = new Set()) {
        if (visited.has(courseId)) {
            return null; // Cycle detected
        }
        visited.add(courseId);

        const course = await Course.findByPk(courseId, {
            attributes: ['id', 'code', 'name'],
            include: [{
                model: Course,
                as: 'prerequisites',
                attributes: ['id', 'code', 'name'],
                through: { attributes: [] }
            }]
        });

        if (!course) return null;

        const tree = {
            id: course.id,
            code: course.code,
            name: course.name,
            prerequisites: []
        };

        for (const prereq of course.prerequisites || []) {
            const subTree = await this.getPrerequisiteTree(prereq.id, new Set(visited));
            if (subTree) {
                tree.prerequisites.push(subTree);
            }
        }

        return tree;
    }
}

module.exports = PrerequisiteService;
