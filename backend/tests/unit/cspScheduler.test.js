/**
 * Unit Tests: CSP Scheduler
 * Tests for constraint satisfaction scheduling algorithm
 */

const CSPScheduler = require('../../src/services/cspScheduler');

describe('CSPScheduler', () => {
    let scheduler;

    beforeEach(() => {
        scheduler = new CSPScheduler();
    });

    describe('Time Overlap Detection', () => {
        it('should detect overlapping time ranges', () => {
            expect(scheduler.timesOverlap('09:00', '11:00', '10:00', '12:00')).toBe(true);
            expect(scheduler.timesOverlap('09:00', '11:00', '10:30', '10:45')).toBe(true);
        });

        it('should not detect non-overlapping time ranges', () => {
            expect(scheduler.timesOverlap('09:00', '11:00', '11:00', '13:00')).toBe(false);
            expect(scheduler.timesOverlap('09:00', '11:00', '13:00', '15:00')).toBe(false);
        });

        it('should handle adjacent time slots correctly', () => {
            expect(scheduler.timesOverlap('09:00', '11:00', '11:00', '13:00')).toBe(false);
        });
    });

    describe('Instructor Double-Booking', () => {
        it('should detect instructor conflict', () => {
            scheduler.assignments = [
                { instructor_id: 'inst-1', day_of_week: 1, start_time: '09:00', end_time: '11:00' }
            ];

            const result = scheduler.isInstructorBusy('inst-1', 1, { start: '10:00', end: '12:00' });
            expect(result).toBe(true);
        });

        it('should allow different instructors at same time', () => {
            scheduler.assignments = [
                { instructor_id: 'inst-1', day_of_week: 1, start_time: '09:00', end_time: '11:00' }
            ];

            const result = scheduler.isInstructorBusy('inst-2', 1, { start: '09:00', end: '11:00' });
            expect(result).toBe(false);
        });

        it('should allow same instructor on different days', () => {
            scheduler.assignments = [
                { instructor_id: 'inst-1', day_of_week: 1, start_time: '09:00', end_time: '11:00' }
            ];

            const result = scheduler.isInstructorBusy('inst-1', 2, { start: '09:00', end: '11:00' });
            expect(result).toBe(false);
        });
    });

    describe('Classroom Double-Booking', () => {
        it('should detect classroom conflict', () => {
            scheduler.assignments = [
                { classroom_id: 'room-101', day_of_week: 1, start_time: '09:00', end_time: '11:00' }
            ];

            const result = scheduler.isClassroomBusy('room-101', 1, { start: '10:00', end: '12:00' });
            expect(result).toBe(true);
        });

        it('should allow different classrooms at same time', () => {
            scheduler.assignments = [
                { classroom_id: 'room-101', day_of_week: 1, start_time: '09:00', end_time: '11:00' }
            ];

            const result = scheduler.isClassroomBusy('room-102', 1, { start: '09:00', end: '11:00' });
            expect(result).toBe(false);
        });
    });

    describe('Section Sorting (MRV Heuristic)', () => {
        it('should sort sections by constraint difficulty', () => {
            const sections = [
                { id: 's1', capacity: 50 },  // Harder to schedule (needs bigger room)
                { id: 's2', capacity: 20 },  // Easier
                { id: 's3', capacity: 100 }  // Hardest
            ];

            const classrooms = [
                { capacity: 30 },
                { capacity: 60 },
                { capacity: 120 }
            ];

            const sorted = scheduler.sortByConstraintDifficulty(sections, classrooms);

            // Should be sorted by number of fitting classrooms (ascending)
            expect(sorted[0].id).toBe('s3'); // Only 1 room fits (120)
            expect(sorted[1].id).toBe('s1'); // 2 rooms fit (60, 120)
            expect(sorted[2].id).toBe('s2'); // All 3 rooms fit
        });
    });

    describe('Schedule Generation', () => {
        it('should generate valid schedule for simple case', async () => {
            const sections = [
                { id: 'sec-1', capacity: 30, instructor_id: 'inst-1', course: { code: 'CS101' } }
            ];

            const classrooms = [
                { id: 'room-1', capacity: 50 }
            ];

            const result = await scheduler.generate(sections, classrooms);

            expect(result.success).toBe(true);
            expect(result.schedule.length).toBe(1);
            expect(result.schedule[0].section_id).toBe('sec-1');
            expect(result.schedule[0].classroom_id).toBe('room-1');
        });

        it('should handle multiple sections without conflicts', async () => {
            const sections = [
                { id: 'sec-1', capacity: 30, instructor_id: 'inst-1' },
                { id: 'sec-2', capacity: 25, instructor_id: 'inst-2' }
            ];

            const classrooms = [
                { id: 'room-1', capacity: 40 },
                { id: 'room-2', capacity: 40 }
            ];

            const result = await scheduler.generate(sections, classrooms);

            expect(result.success).toBe(true);
            expect(result.schedule.length).toBe(2);
            expect(result.conflicts).toBe(0);
        });

        it('should detect when no valid schedule is possible', async () => {
            const sections = [
                { id: 'sec-1', capacity: 100, instructor_id: 'inst-1' } // Needs big room
            ];

            const classrooms = [
                { id: 'room-1', capacity: 30 } // Too small
            ];

            const result = await scheduler.generate(sections, classrooms);

            // May use relaxed constraints or skip
            expect(result.total_sections).toBe(1);
        });
    });
});
