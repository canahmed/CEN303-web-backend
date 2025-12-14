/**
 * Unit tests for ScheduleConflictService
 * Tests time overlap detection and schedule parsing
 */

const ScheduleConflictService = require('../../src/services/scheduleConflictService');

describe('ScheduleConflictService', () => {
    describe('timeToMinutes', () => {
        it('should convert time string to minutes', () => {
            expect(ScheduleConflictService.timeToMinutes('09:00')).toBe(540);
            expect(ScheduleConflictService.timeToMinutes('14:30')).toBe(870);
            expect(ScheduleConflictService.timeToMinutes('00:00')).toBe(0);
            expect(ScheduleConflictService.timeToMinutes('23:59')).toBe(1439);
        });

        it('should return 0 for invalid input', () => {
            expect(ScheduleConflictService.timeToMinutes(null)).toBe(0);
            expect(ScheduleConflictService.timeToMinutes(undefined)).toBe(0);
        });
    });

    describe('parseSchedule', () => {
        it('should parse valid JSON array', () => {
            const schedule = [
                { day: 'Monday', start_time: '09:00', end_time: '10:30' }
            ];
            const result = ScheduleConflictService.parseSchedule(schedule);
            expect(result).toEqual(schedule);
        });

        it('should parse JSON string', () => {
            const scheduleStr = '[{"day":"Monday","start_time":"09:00","end_time":"10:30"}]';
            const result = ScheduleConflictService.parseSchedule(scheduleStr);
            expect(result).toHaveLength(1);
            expect(result[0].day).toBe('Monday');
        });

        it('should return empty array for null/undefined', () => {
            expect(ScheduleConflictService.parseSchedule(null)).toEqual([]);
            expect(ScheduleConflictService.parseSchedule(undefined)).toEqual([]);
        });

        it('should return empty array for invalid JSON', () => {
            expect(ScheduleConflictService.parseSchedule('invalid json')).toEqual([]);
        });
    });

    describe('hasTimeOverlap', () => {
        it('should detect overlap on same day', () => {
            const slot1 = { day: 'Monday', start_time: '09:00', end_time: '10:30' };
            const slot2 = { day: 'Monday', start_time: '10:00', end_time: '11:30' };

            expect(ScheduleConflictService.hasTimeOverlap(slot1, slot2)).toBe(true);
        });

        it('should not detect overlap on different days', () => {
            const slot1 = { day: 'Monday', start_time: '09:00', end_time: '10:30' };
            const slot2 = { day: 'Tuesday', start_time: '09:00', end_time: '10:30' };

            expect(ScheduleConflictService.hasTimeOverlap(slot1, slot2)).toBe(false);
        });

        it('should not detect overlap when times are adjacent', () => {
            const slot1 = { day: 'Monday', start_time: '09:00', end_time: '10:00' };
            const slot2 = { day: 'Monday', start_time: '10:00', end_time: '11:00' };

            // Adjacent times should NOT overlap
            expect(ScheduleConflictService.hasTimeOverlap(slot1, slot2)).toBe(false);
        });

        it('should detect full containment overlap', () => {
            const slot1 = { day: 'Monday', start_time: '09:00', end_time: '12:00' };
            const slot2 = { day: 'Monday', start_time: '10:00', end_time: '11:00' };

            expect(ScheduleConflictService.hasTimeOverlap(slot1, slot2)).toBe(true);
        });

        it('should not detect overlap when times do not intersect', () => {
            const slot1 = { day: 'Monday', start_time: '09:00', end_time: '10:00' };
            const slot2 = { day: 'Monday', start_time: '14:00', end_time: '15:00' };

            expect(ScheduleConflictService.hasTimeOverlap(slot1, slot2)).toBe(false);
        });
    });
});
