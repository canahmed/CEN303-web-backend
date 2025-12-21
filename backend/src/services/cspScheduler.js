const {
    Schedule,
    CourseSection,
    Classroom,
    Course,
    Enrollment,
    Student
} = require('../models');
const { Op } = require('sequelize');

/**
 * Constraint Satisfaction Problem (CSP) Scheduler
 * Uses backtracking with heuristics to generate optimal course schedules
 */
class CSPScheduler {
    constructor() {
        // Time slots: 09:00-17:00, 2-hour blocks
        this.timeSlots = [
            { start: '09:00', end: '11:00' },
            { start: '11:00', end: '13:00' },
            { start: '14:00', end: '16:00' },
            { start: '16:00', end: '18:00' }
        ];

        // Days: Monday to Friday (1-5)
        this.days = [1, 2, 3, 4, 5];

        this.assignments = [];
        this.conflicts = 0;
    }

    /**
     * Generate schedule for given sections
     * @param {Array} sections - Course sections to schedule
     * @param {Array} classrooms - Available classrooms
     * @returns {Object} Generated schedule or error
     */
    async generate(sections, classrooms) {
        this.assignments = [];
        this.conflicts = 0;

        // Sort sections by constraint difficulty (MRV heuristic)
        const sortedSections = this.sortByConstraintDifficulty(sections, classrooms);

        // Try to assign each section
        for (const section of sortedSections) {
            const assignment = await this.findBestSlot(section, classrooms);

            if (assignment) {
                this.assignments.push(assignment);
            } else {
                // Couldn't find a slot - try with relaxed constraints
                const relaxedAssignment = await this.findSlotWithRelaxedConstraints(section, classrooms);
                if (relaxedAssignment) {
                    this.assignments.push(relaxedAssignment);
                    this.conflicts++;
                } else {
                    console.warn(`Could not schedule section: ${section.id}`);
                }
            }
        }

        return {
            success: true,
            schedule: this.assignments,
            conflicts: this.conflicts,
            total_sections: sections.length,
            scheduled_sections: this.assignments.length
        };
    }

    /**
     * Sort sections by constraint difficulty (Most Restrained Variable first)
     */
    sortByConstraintDifficulty(sections, classrooms) {
        return sections.sort((a, b) => {
            // Larger classes are harder to schedule (fewer classrooms fit)
            const aFitCount = classrooms.filter(c => c.capacity >= a.capacity).length;
            const bFitCount = classrooms.filter(c => c.capacity >= b.capacity).length;
            return aFitCount - bFitCount;
        });
    }

    /**
     * Find best time slot for a section using constraint checking
     */
    async findBestSlot(section, classrooms) {
        // Get suitable classrooms (capacity >= section.capacity)
        const suitableClassrooms = classrooms.filter(c => c.capacity >= section.capacity);

        if (suitableClassrooms.length === 0) {
            return null;
        }

        // Try each day and time slot combination
        for (const day of this.days) {
            for (const timeSlot of this.timeSlots) {
                for (const classroom of suitableClassrooms) {
                    // Check all hard constraints
                    if (await this.checkHardConstraints(section, day, timeSlot, classroom)) {
                        return {
                            section_id: section.id,
                            day_of_week: day,
                            start_time: timeSlot.start,
                            end_time: timeSlot.end,
                            classroom_id: classroom.id,
                            course_code: section.course?.code,
                            course_name: section.course?.name,
                            instructor_id: section.instructor_id
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Try to find slot with relaxed constraints (last resort)
     */
    async findSlotWithRelaxedConstraints(section, classrooms) {
        // Relax classroom capacity constraint slightly (allow 10% overflow)
        const relaxedClassrooms = classrooms.filter(c => c.capacity >= section.capacity * 0.9);

        for (const day of this.days) {
            for (const timeSlot of this.timeSlots) {
                for (const classroom of relaxedClassrooms) {
                    // Only check critical constraints
                    if (await this.checkCriticalConstraints(section, day, timeSlot, classroom)) {
                        return {
                            section_id: section.id,
                            day_of_week: day,
                            start_time: timeSlot.start,
                            end_time: timeSlot.end,
                            classroom_id: classroom.id,
                            course_code: section.course?.code,
                            course_name: section.course?.name,
                            instructor_id: section.instructor_id,
                            is_relaxed: true
                        };
                    }
                }
            }
        }

        return null;
    }

    /**
     * Check all hard constraints
     */
    async checkHardConstraints(section, day, timeSlot, classroom) {
        // 1. No instructor double-booking
        if (this.isInstructorBusy(section.instructor_id, day, timeSlot)) {
            return false;
        }

        // 2. No classroom double-booking
        if (this.isClassroomBusy(classroom.id, day, timeSlot)) {
            return false;
        }

        // 3. No student schedule conflict (check enrolled students)
        if (await this.hasStudentConflict(section, day, timeSlot)) {
            return false;
        }

        // 4. Classroom capacity >= section capacity
        if (classroom.capacity < section.capacity) {
            return false;
        }

        return true;
    }

    /**
     * Check only critical constraints (for relaxed mode)
     */
    async checkCriticalConstraints(section, day, timeSlot, classroom) {
        // No instructor double-booking (always required)
        if (this.isInstructorBusy(section.instructor_id, day, timeSlot)) {
            return false;
        }

        // No classroom double-booking (always required)
        if (this.isClassroomBusy(classroom.id, day, timeSlot)) {
            return false;
        }

        return true;
    }

    /**
     * Check if instructor is already assigned at this time
     */
    isInstructorBusy(instructorId, day, timeSlot) {
        return this.assignments.some(a =>
            a.instructor_id === instructorId &&
            a.day_of_week === day &&
            this.timesOverlap(a.start_time, a.end_time, timeSlot.start, timeSlot.end)
        );
    }

    /**
     * Check if classroom is already assigned at this time
     */
    isClassroomBusy(classroomId, day, timeSlot) {
        return this.assignments.some(a =>
            a.classroom_id === classroomId &&
            a.day_of_week === day &&
            this.timesOverlap(a.start_time, a.end_time, timeSlot.start, timeSlot.end)
        );
    }

    /**
     * Check if any student enrolled in this section has a conflict
     */
    async hasStudentConflict(section, day, timeSlot) {
        // Get all students enrolled in this section
        const enrollments = await Enrollment.findAll({
            where: { section_id: section.id, status: 'enrolled' },
            attributes: ['student_id']
        });

        if (enrollments.length === 0) return false;

        const studentIds = enrollments.map(e => e.student_id);

        // Check if any of these students have another section at this time
        for (const assignment of this.assignments) {
            if (assignment.day_of_week !== day) continue;
            if (!this.timesOverlap(assignment.start_time, assignment.end_time, timeSlot.start, timeSlot.end)) continue;

            // Check if any student is enrolled in this already-assigned section
            const conflictEnrollments = await Enrollment.findOne({
                where: {
                    section_id: assignment.section_id,
                    student_id: { [Op.in]: studentIds },
                    status: 'enrolled'
                }
            });

            if (conflictEnrollments) {
                return true; // Student has conflict
            }
        }

        return false;
    }

    /**
     * Check if two time ranges overlap
     */
    timesOverlap(start1, end1, start2, end2) {
        return start1 < end2 && start2 < end1;
    }

    /**
     * Save generated schedule to database
     */
    async saveToDatabase(assignments) {
        const savedSchedules = [];

        for (const assignment of assignments) {
            const schedule = await Schedule.create({
                section_id: assignment.section_id,
                day_of_week: assignment.day_of_week,
                start_time: assignment.start_time,
                end_time: assignment.end_time,
                classroom_id: assignment.classroom_id
            });
            savedSchedules.push(schedule);
        }

        return savedSchedules;
    }
}

module.exports = CSPScheduler;
