/**
 * Integration tests for Authentication endpoints
 * These tests require a running database connection
 * Run with: npm run test:integration
 */

const request = require('supertest');
const app = require('../../src/app');
const { User, Department, Student, Faculty, sequelize } = require('../../src/models');
const { hashPassword } = require('../../src/utils/hash');

// Test data
let testDepartment;
let testUser;
let accessToken;
let refreshToken;

// Note: These tests are designed to run against a test database
// In a real scenario, you would set up a test database and seed it before tests

describe('Auth Endpoints', () => {
    // Skip integration tests if no database connection
    const skipIfNoDb = async () => {
        try {
            await sequelize.authenticate();
            return false;
        } catch (error) {
            console.log('Skipping integration tests - no database connection');
            return true;
        }
    };

    beforeAll(async () => {
        const skip = await skipIfNoDb();
        if (skip) return;

        // Setup test data
        try {
            await sequelize.sync({ force: true });

            testDepartment = await Department.create({
                name: 'Test Department',
                code: 'TEST',
                faculty: 'Test Faculty'
            });

            const passwordHash = await hashPassword('TestPassword123!');
            testUser = await User.create({
                email: 'existing@test.com',
                password_hash: passwordHash,
                role: 'student',
                first_name: 'Existing',
                last_name: 'User',
                is_active: true
            });

            await Student.create({
                user_id: testUser.id,
                student_number: 'TEST001',
                department_id: testDepartment.id,
                enrollment_year: 2024
            });
        } catch (error) {
            console.error('Setup error:', error.message);
        }
    });

    afterAll(async () => {
        try {
            await sequelize.close();
        } catch (error) {
            // Ignore close errors
        }
    });

    describe('POST /api/v1/auth/register', () => {
        it('should register a new student', async () => {
            const skip = await skipIfNoDb();
            if (skip) return;

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'newstudent@test.com',
                    password: 'NewPassword123!',
                    confirmPassword: 'NewPassword123!',
                    firstName: 'New',
                    lastName: 'Student',
                    role: 'student',
                    studentNumber: 'STU001',
                    departmentId: testDepartment.id
                });

            expect(res.statusCode).toBe(201);
            expect(res.body.success).toBe(true);
            expect(res.body.data.user.email).toBe('newstudent@test.com');
        });

        it('should reject duplicate email', async () => {
            const skip = await skipIfNoDb();
            if (skip) return;

            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'existing@test.com',
                    password: 'TestPassword123!',
                    confirmPassword: 'TestPassword123!',
                    firstName: 'Duplicate',
                    lastName: 'User',
                    role: 'student',
                    studentNumber: 'STU002',
                    departmentId: testDepartment.id
                });

            expect(res.statusCode).toBe(409);
            expect(res.body.success).toBe(false);
        });

        it('should reject invalid email format', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'invalid-email',
                    password: 'TestPassword123!',
                    confirmPassword: 'TestPassword123!',
                    firstName: 'Test',
                    lastName: 'User',
                    role: 'student',
                    studentNumber: 'STU003',
                    departmentId: testDepartment?.id || '123e4567-e89b-12d3-a456-426614174000'
                });

            expect(res.statusCode).toBe(400);
        });

        it('should reject weak password', async () => {
            const res = await request(app)
                .post('/api/v1/auth/register')
                .send({
                    email: 'weakpass@test.com',
                    password: '123456',
                    confirmPassword: '123456',
                    firstName: 'Weak',
                    lastName: 'Password',
                    role: 'student',
                    studentNumber: 'STU004',
                    departmentId: testDepartment?.id || '123e4567-e89b-12d3-a456-426614174000'
                });

            expect(res.statusCode).toBe(400);
        });
    });

    describe('POST /api/v1/auth/login', () => {
        it('should login existing user', async () => {
            const skip = await skipIfNoDb();
            if (skip) return;

            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'existing@test.com',
                    password: 'TestPassword123!'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.accessToken).toBeDefined();
            expect(res.body.data.refreshToken).toBeDefined();

            accessToken = res.body.data.accessToken;
            refreshToken = res.body.data.refreshToken;
        });

        it('should reject invalid credentials', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'existing@test.com',
                    password: 'WrongPassword123!'
                });

            expect(res.statusCode).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post('/api/v1/auth/login')
                .send({
                    email: 'nonexistent@test.com',
                    password: 'TestPassword123!'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /api/v1/auth/refresh', () => {
        it('should refresh access token', async () => {
            const skip = await skipIfNoDb();
            if (skip || !refreshToken) return;

            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({
                    refreshToken: refreshToken
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.data.accessToken).toBeDefined();
        });

        it('should reject invalid refresh token', async () => {
            const res = await request(app)
                .post('/api/v1/auth/refresh')
                .send({
                    refreshToken: 'invalid-token'
                });

            expect(res.statusCode).toBe(401);
        });
    });

    describe('POST /api/v1/auth/forgot-password', () => {
        it('should accept password reset request', async () => {
            const res = await request(app)
                .post('/api/v1/auth/forgot-password')
                .send({
                    email: 'existing@test.com'
                });

            // Always returns 200 to prevent email enumeration
            expect(res.statusCode).toBe(200);
        });
    });

    describe('POST /api/v1/auth/logout', () => {
        it('should logout user', async () => {
            const skip = await skipIfNoDb();
            if (skip || !accessToken) return;

            const res = await request(app)
                .post('/api/v1/auth/logout')
                .set('Authorization', `Bearer ${accessToken}`);

            expect(res.statusCode).toBe(200);
        });

        it('should reject unauthenticated request', async () => {
            const res = await request(app)
                .post('/api/v1/auth/logout');

            expect(res.statusCode).toBe(401);
        });
    });
});
