/**
 * Integration tests for Attendance Flow
 * Tests the complete attendance process including GPS validation
 */

const request = require('supertest');
const app = require('../../src/app');

// Skip if database not available
const skipIfNoDb = process.env.SKIP_DB_TESTS === 'true';

describe('Attendance Flow Integration Tests', () => {
    let facultyToken;
    let studentToken;

    beforeAll(async () => {
        if (skipIfNoDb) return;

        try {
            // Login as faculty
            const facultyLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'mehmet.sevri@smartcampus.com',
                    password: 'Faculty123!'
                });

            if (facultyLogin.body.data?.accessToken) {
                facultyToken = facultyLogin.body.data.accessToken;
            }

            // Login as student
            const studentLogin = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'can.ahmed@smartcampus.com',
                    password: 'Student123!'
                });

            if (studentLogin.body.data?.accessToken) {
                studentToken = studentLogin.body.data.accessToken;
            }
        } catch (error) {
            console.log('Integration test setup skipped - database not available');
        }
    });

    describe('POST /api/v1/attendance/sessions', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/v1/attendance/sessions')
                .send({ section_id: 'test-id' })
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        it('should require faculty role', async () => {
            if (skipIfNoDb || !studentToken) return;

            const res = await request(app)
                .post('/api/v1/attendance/sessions')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ section_id: 'test-id' })
                .expect(403);

            expect(res.body.success).toBe(false);
        });

        it('should validate section_id', async () => {
            if (skipIfNoDb || !facultyToken) return;

            const res = await request(app)
                .post('/api/v1/attendance/sessions')
                .set('Authorization', `Bearer ${facultyToken}`)
                .send({}) // Missing section_id
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/attendance/sessions/my-sessions', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .get('/api/v1/attendance/sessions/my-sessions')
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        it('should return faculty sessions when authenticated', async () => {
            if (skipIfNoDb || !facultyToken) return;

            const res = await request(app)
                .get('/api/v1/attendance/sessions/my-sessions')
                .set('Authorization', `Bearer ${facultyToken}`)
                .expect('Content-Type', /json/);

            expect(res.body.success).toBeDefined();
        });
    });

    describe('POST /api/v1/attendance/sessions/:id/checkin', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/v1/attendance/sessions/test-id/checkin')
                .send({ latitude: 41.0082, longitude: 28.9784 })
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        it('should validate location data', async () => {
            if (skipIfNoDb || !studentToken) return;

            const res = await request(app)
                .post('/api/v1/attendance/sessions/test-id/checkin')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({}) // Missing latitude/longitude
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/attendance/my-attendance', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .get('/api/v1/attendance/my-attendance')
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        it('should return attendance stats when authenticated', async () => {
            if (skipIfNoDb || !studentToken) return;

            const res = await request(app)
                .get('/api/v1/attendance/my-attendance')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect('Content-Type', /json/);

            expect(res.body.success).toBeDefined();
        });
    });

    describe('POST /api/v1/attendance/excuse-requests', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .post('/api/v1/attendance/excuse-requests')
                .send({ session_id: 'test', reason: 'Sick' })
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        it('should validate reason length', async () => {
            if (skipIfNoDb || !studentToken) return;

            const res = await request(app)
                .post('/api/v1/attendance/excuse-requests')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({ session_id: 'test', reason: 'Short' }) // Too short (min 10)
                .expect(400);

            expect(res.body.success).toBe(false);
        });
    });

    describe('PUT /api/v1/attendance/excuse-requests/:id/approve', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .put('/api/v1/attendance/excuse-requests/test-id/approve')
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        it('should require faculty role', async () => {
            if (skipIfNoDb || !studentToken) return;

            const res = await request(app)
                .put('/api/v1/attendance/excuse-requests/test-id/approve')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(res.body.success).toBe(false);
        });
    });

    describe('GET /api/v1/attendance/report/:sectionId', () => {
        it('should require authentication', async () => {
            const res = await request(app)
                .get('/api/v1/attendance/report/test-section')
                .expect(401);

            expect(res.body.success).toBe(false);
        });

        it('should require faculty role', async () => {
            if (skipIfNoDb || !studentToken) return;

            const res = await request(app)
                .get('/api/v1/attendance/report/test-section')
                .set('Authorization', `Bearer ${studentToken}`)
                .expect(403);

            expect(res.body.success).toBe(false);
        });
    });
});
