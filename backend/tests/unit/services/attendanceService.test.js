/**
 * Unit tests for AttendanceService
 * Tests Haversine distance calculation and GPS spoofing detection
 */

const AttendanceService = require('../../src/services/attendanceService');

describe('AttendanceService', () => {
    describe('calculateDistance (Haversine formula)', () => {
        it('should return 0 for same coordinates', () => {
            const distance = AttendanceService.calculateDistance(41.0082, 28.9784, 41.0082, 28.9784);
            expect(distance).toBe(0);
        });

        it('should calculate distance between two points correctly', () => {
            // Istanbul to Ankara approximately 350km
            const distance = AttendanceService.calculateDistance(
                41.0082, 28.9784,  // Istanbul
                39.9334, 32.8597   // Ankara
            );

            // Should be approximately 350km (350000 meters) with some tolerance
            expect(distance).toBeGreaterThan(300000);
            expect(distance).toBeLessThan(400000);
        });

        it('should calculate short distance correctly', () => {
            // Two points about 100 meters apart
            const lat1 = 41.0082;
            const lon1 = 28.9784;
            const lat2 = 41.0091; // ~100m north
            const lon2 = 28.9784;

            const distance = AttendanceService.calculateDistance(lat1, lon1, lat2, lon2);

            // Should be approximately 100 meters
            expect(distance).toBeGreaterThan(80);
            expect(distance).toBeLessThan(120);
        });

        it('should handle negative coordinates', () => {
            // Sydney, Australia
            const distance = AttendanceService.calculateDistance(
                -33.8688, 151.2093,
                -33.8700, 151.2100
            );

            expect(distance).toBeGreaterThan(0);
            expect(distance).toBeLessThan(500); // Should be less than 500m
        });
    });

    describe('detectSpoofing', () => {
        const defaultRadius = 15; // 15 meters geofence

        it('should not flag when within radius', () => {
            const result = AttendanceService.detectSpoofing(10, 5, defaultRadius);

            expect(result.isFlagged).toBe(false);
            expect(result.flagReason).toBeNull();
        });

        it('should flag when outside radius', () => {
            const result = AttendanceService.detectSpoofing(100, 5, defaultRadius);

            expect(result.isFlagged).toBe(true);
            expect(result.flagReason).toContain('Sınıf dışından');
        });

        it('should consider GPS accuracy buffer', () => {
            // Distance is 25m, radius is 15m, but accuracy is 10m
            // Allowed = 15 + 5 (buffer) + 10 (accuracy) = 30m
            const result = AttendanceService.detectSpoofing(25, 10, defaultRadius);

            expect(result.isFlagged).toBe(false);
        });

        it('should flag suspicious GPS accuracy (0)', () => {
            const result = AttendanceService.detectSpoofing(5, 0, defaultRadius);

            expect(result.isFlagged).toBe(true);
            expect(result.flagReason).toContain('Şüpheli GPS');
        });

        it('should flag very low GPS accuracy', () => {
            const result = AttendanceService.detectSpoofing(5, 0.5, defaultRadius);

            expect(result.isFlagged).toBe(true);
            expect(result.flagReason).toContain('Şüpheli GPS');
        });

        it('should allow normal GPS accuracy', () => {
            const result = AttendanceService.detectSpoofing(10, 5, defaultRadius);

            expect(result.isFlagged).toBe(false);
        });
    });

    describe('constants', () => {
        it('should have correct default values', () => {
            expect(AttendanceService.DEFAULT_GEOFENCE_RADIUS).toBe(15);
            expect(AttendanceService.QR_EXPIRY_MINUTES).toBe(30);
            expect(AttendanceService.ACCURACY_BUFFER).toBe(5);
        });
    });
});
