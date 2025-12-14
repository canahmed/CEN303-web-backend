const { Enrollment, CourseSection } = require('../models');

/**
 * ScheduleConflictService - Time overlap detection
 */
class ScheduleConflictService {
    /**
     * Check if a new section conflicts with student's current schedule
     * @param {number} studentId - Student ID
     * @param {Object} newSection - New section with schedule_json
     * @returns {Promise<{hasConflict: boolean, conflicts: Array}>}
     */
    static async checkConflict(studentId, newSection) {
        // Get student's current enrollments
        const enrollments = await Enrollment.findAll({
            where: {
                student_id: studentId,
                status: 'enrolled'
            },
            include: [{
                model: CourseSection,
                as: 'section',
                where: {
                    semester: newSection.semester,
                    year: newSection.year
                },
                required: true,
                include: ['course']
            }]
        });

        const newSchedule = this.parseSchedule(newSection.schedule_json);
        const conflicts = [];

        for (const enrollment of enrollments) {
            const existingSchedule = this.parseSchedule(enrollment.section.schedule_json);

            for (const newSlot of newSchedule) {
                for (const existingSlot of existingSchedule) {
                    if (this.hasTimeOverlap(newSlot, existingSlot)) {
                        conflicts.push({
                            courseCode: enrollment.section.course?.code,
                            courseName: enrollment.section.course?.name,
                            sectionNumber: enrollment.section.section_number,
                            conflictDay: newSlot.day,
                            existingTime: `${existingSlot.start_time}-${existingSlot.end_time}`,
                            newTime: `${newSlot.start_time}-${newSlot.end_time}`
                        });
                    }
                }
            }
        }

        return {
            hasConflict: conflicts.length > 0,
            conflicts
        };
    }

    /**
     * Parse schedule JSON to array of time slots
     * @param {string|Array} scheduleJson - Schedule as JSON string or array
     * @returns {Array} - Array of schedule slots
     */
    static parseSchedule(scheduleJson) {
        if (!scheduleJson) return [];

        try {
            if (typeof scheduleJson === 'string') {
                return JSON.parse(scheduleJson);
            }
            return scheduleJson;
        } catch (error) {
            console.error('Error parsing schedule:', error);
            return [];
        }
    }

    /**
     * Check if two time slots overlap on the same day
     * @param {Object} slot1 - First time slot {day, start_time, end_time}
     * @param {Object} slot2 - Second time slot {day, start_time, end_time}
     * @returns {boolean} - True if overlap exists
     */
    static hasTimeOverlap(slot1, slot2) {
        // Must be same day
        if (slot1.day !== slot2.day) {
            return false;
        }

        const start1 = this.timeToMinutes(slot1.start_time);
        const end1 = this.timeToMinutes(slot1.end_time);
        const start2 = this.timeToMinutes(slot2.start_time);
        const end2 = this.timeToMinutes(slot2.end_time);

        // Check overlap: NOT (end1 <= start2 OR end2 <= start1)
        return !(end1 <= start2 || end2 <= start1);
    }

    /**
     * Convert time string to minutes since midnight
     * @param {string} time - Time in HH:MM format
     * @returns {number} - Minutes since midnight
     */
    static timeToMinutes(time) {
        if (!time) return 0;
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }

    /**
     * Get student's full schedule for a semester
     * @param {number} studentId - Student ID
     * @param {string} semester - Semester (fall, spring, summer)
     * @param {number} year - Academic year
     * @returns {Promise<Array>} - Full weekly schedule
     */
    static async getStudentSchedule(studentId, semester, year) {
        const enrollments = await Enrollment.findAll({
            where: {
                student_id: studentId,
                status: 'enrolled'
            },
            include: [{
                model: CourseSection,
                as: 'section',
                where: { semester, year },
                required: true,
                include: ['course', 'classroom']
            }]
        });

        const schedule = [];
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        for (const day of days) {
            const daySchedule = {
                day,
                slots: []
            };

            for (const enrollment of enrollments) {
                const sectionSchedule = this.parseSchedule(enrollment.section.schedule_json);

                for (const slot of sectionSchedule) {
                    if (slot.day === day) {
                        daySchedule.slots.push({
                            courseCode: enrollment.section.course?.code,
                            courseName: enrollment.section.course?.name,
                            sectionNumber: enrollment.section.section_number,
                            startTime: slot.start_time,
                            endTime: slot.end_time,
                            classroom: enrollment.section.classroom ?
                                `${enrollment.section.classroom.building} ${enrollment.section.classroom.room_number}` : null
                        });
                    }
                }
            }

            // Sort by start time
            daySchedule.slots.sort((a, b) =>
                this.timeToMinutes(a.startTime) - this.timeToMinutes(b.startTime)
            );

            schedule.push(daySchedule);
        }

        return schedule;
    }
}

module.exports = ScheduleConflictService;
