/**
 * Unit tests for GradeService
 * Tests grade calculation, GPA/CGPA calculation
 */

const GradeService = require('../../src/services/gradeService');

describe('GradeService', () => {
    describe('calculateLetterGrade', () => {
        it('should calculate AA for 90+ average', () => {
            const result = GradeService.calculateLetterGrade(90, 95);
            expect(result).toBe('AA');
        });

        it('should calculate BA for 85-89 average', () => {
            const result = GradeService.calculateLetterGrade(85, 87);
            expect(result).toBe('BA');
        });

        it('should calculate BB for 80-84 average', () => {
            const result = GradeService.calculateLetterGrade(80, 82);
            expect(result).toBe('BB');
        });

        it('should calculate CB for 75-79 average', () => {
            const result = GradeService.calculateLetterGrade(75, 77);
            expect(result).toBe('CB');
        });

        it('should calculate CC for 70-74 average', () => {
            const result = GradeService.calculateLetterGrade(70, 72);
            expect(result).toBe('CC');
        });

        it('should calculate FF if final < 50', () => {
            const result = GradeService.calculateLetterGrade(100, 45);
            expect(result).toBe('FF');
        });

        it('should return null if grades are null', () => {
            expect(GradeService.calculateLetterGrade(null, 90)).toBeNull();
            expect(GradeService.calculateLetterGrade(90, null)).toBeNull();
        });

        it('should use correct weighting (40% midterm, 60% final)', () => {
            // 70 * 0.4 + 80 * 0.6 = 28 + 48 = 76 -> CB
            const result = GradeService.calculateLetterGrade(70, 80);
            expect(result).toBe('CB');
        });
    });

    describe('getGradePoint', () => {
        it('should return 4.00 for AA', () => {
            expect(GradeService.getGradePoint('AA')).toBe(4.00);
        });

        it('should return 3.50 for BA', () => {
            expect(GradeService.getGradePoint('BA')).toBe(3.50);
        });

        it('should return 3.00 for BB', () => {
            expect(GradeService.getGradePoint('BB')).toBe(3.00);
        });

        it('should return 0.00 for FF', () => {
            expect(GradeService.getGradePoint('FF')).toBe(0.00);
        });

        it('should return null for I (Incomplete)', () => {
            expect(GradeService.getGradePoint('I')).toBeNull();
        });

        it('should return null for W (Withdrawn)', () => {
            expect(GradeService.getGradePoint('W')).toBeNull();
        });

        it('should return null for invalid grade', () => {
            expect(GradeService.getGradePoint('XYZ')).toBeNull();
        });
    });

    describe('calculateWeightedGPA', () => {
        it('should calculate GPA correctly', () => {
            const enrollments = [
                { grade_point: 4.00, section: { course: { credits: 3 } } },
                { grade_point: 3.00, section: { course: { credits: 3 } } },
            ];

            // (4*3 + 3*3) / 6 = 21/6 = 3.5
            const result = GradeService.calculateWeightedGPA(enrollments);
            expect(result).toBe(3.5);
        });

        it('should return 0 for empty enrollments', () => {
            const result = GradeService.calculateWeightedGPA([]);
            expect(result).toBe(0);
        });

        it('should skip null grade points', () => {
            const enrollments = [
                { grade_point: 4.00, section: { course: { credits: 3 } } },
                { grade_point: null, section: { course: { credits: 3 } } }, // Incomplete
            ];

            const result = GradeService.calculateWeightedGPA(enrollments);
            expect(result).toBe(4.00);
        });

        it('should round to 2 decimal places', () => {
            const enrollments = [
                { grade_point: 4.00, section: { course: { credits: 3 } } },
                { grade_point: 3.00, section: { course: { credits: 4 } } },
            ];

            // (4*3 + 3*4) / 7 = 24/7 = 3.428... -> 3.43
            const result = GradeService.calculateWeightedGPA(enrollments);
            expect(result).toBe(3.43);
        });
    });

    describe('GRADE_POINTS constant', () => {
        it('should have all letter grades defined', () => {
            const grades = ['AA', 'BA', 'BB', 'CB', 'CC', 'DC', 'DD', 'FD', 'FF', 'NA', 'I', 'W'];

            for (const grade of grades) {
                expect(GradeService.GRADE_POINTS).toHaveProperty(grade);
            }
        });

        it('should have descending grade points', () => {
            expect(GradeService.GRADE_POINTS['AA']).toBeGreaterThan(GradeService.GRADE_POINTS['BA']);
            expect(GradeService.GRADE_POINTS['BA']).toBeGreaterThan(GradeService.GRADE_POINTS['BB']);
            expect(GradeService.GRADE_POINTS['BB']).toBeGreaterThan(GradeService.GRADE_POINTS['CB']);
        });
    });
});
