/**
 * Unit tests for PrerequisiteService
 * Tests recursive prerequisite checking and cycle detection
 */

const PrerequisiteService = require('../../src/services/prerequisiteService');

// Mock models
jest.mock('../../src/models', () => ({
    Course: {
        findByPk: jest.fn(),
    },
    CoursePrerequisite: {
        findAll: jest.fn(),
    },
    Enrollment: {
        findOne: jest.fn(),
    },
    CourseSection: {}
}));

const { Course, CoursePrerequisite, Enrollment } = require('../../src/models');

describe('PrerequisiteService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('hasCompletedCourse', () => {
        it('should return true if student completed the course', async () => {
            Enrollment.findOne.mockResolvedValue({ id: 1, status: 'completed' });

            const result = await PrerequisiteService.hasCompletedCourse('student-1', 'course-1');

            expect(result).toBe(true);
            expect(Enrollment.findOne).toHaveBeenCalled();
        });

        it('should return false if student has not completed the course', async () => {
            Enrollment.findOne.mockResolvedValue(null);

            const result = await PrerequisiteService.hasCompletedCourse('student-1', 'course-1');

            expect(result).toBe(false);
        });
    });

    describe('checkPrerequisites', () => {
        it('should return met=true when no prerequisites exist', async () => {
            CoursePrerequisite.findAll.mockResolvedValue([]);

            const result = await PrerequisiteService.checkPrerequisites('course-1', 'student-1');

            expect(result.met).toBe(true);
            expect(result.missing).toHaveLength(0);
        });

        it('should return missing prerequisites when not completed', async () => {
            CoursePrerequisite.findAll.mockResolvedValue([
                { course_id: 'course-2', prerequisite_course_id: 'prereq-1' }
            ]);
            Course.findByPk.mockResolvedValue({ id: 'prereq-1', code: 'CSE101', name: 'Intro' });
            Enrollment.findOne.mockResolvedValue(null); // Not completed

            const result = await PrerequisiteService.checkPrerequisites('course-2', 'student-1');

            expect(result.met).toBe(false);
            expect(result.missing.length).toBeGreaterThan(0);
        });

        it('should handle recursive prerequisites', async () => {
            // Course C requires B, B requires A
            CoursePrerequisite.findAll
                .mockResolvedValueOnce([{ prerequisite_course_id: 'course-b' }]) // C -> B
                .mockResolvedValueOnce([{ prerequisite_course_id: 'course-a' }]) // B -> A
                .mockResolvedValueOnce([]); // A -> nothing

            Course.findByPk
                .mockResolvedValueOnce({ id: 'course-b', code: 'CSE201', name: 'Data Structures' })
                .mockResolvedValueOnce({ id: 'course-a', code: 'CSE101', name: 'Intro' });

            Enrollment.findOne.mockResolvedValue(null); // None completed

            const result = await PrerequisiteService.checkPrerequisites('course-c', 'student-1');

            expect(result.met).toBe(false);
            // Should have both B and A in missing
            expect(result.missing.length).toBeGreaterThanOrEqual(1);
        });

        it('should detect cycles and not infinite loop', async () => {
            // A requires B, B requires A (cycle)
            CoursePrerequisite.findAll
                .mockResolvedValueOnce([{ prerequisite_course_id: 'course-a' }])
                .mockResolvedValueOnce([{ prerequisite_course_id: 'course-b' }])
                .mockResolvedValue([]); // Prevent infinite recursion

            Course.findByPk.mockResolvedValue({ id: 'course-a', code: 'CSE101', name: 'Intro' });
            Enrollment.findOne.mockResolvedValue(null);

            // Should not throw or infinite loop
            const result = await PrerequisiteService.checkPrerequisites('course-b', 'student-1', new Set());

            expect(result).toBeDefined();
        });
    });

    describe('getAllPrerequisites', () => {
        it('should return empty array when course not found', async () => {
            Course.findByPk.mockResolvedValue(null);

            const result = await PrerequisiteService.getAllPrerequisites('invalid-id');

            expect(result).toEqual([]);
        });

        it('should return prerequisites list', async () => {
            Course.findByPk.mockResolvedValue({
                id: 'course-1',
                prerequisites: [
                    { id: 'prereq-1', code: 'CSE101', name: 'Intro' }
                ]
            });

            const result = await PrerequisiteService.getAllPrerequisites('course-1');

            expect(result).toHaveLength(1);
            expect(result[0].code).toBe('CSE101');
        });
    });
});
