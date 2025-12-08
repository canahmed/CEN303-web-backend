/**
 * Integration tests for User endpoints
 * These tests require a running database connection
 * Run with: npm run test:integration
 */

const request = require('supertest');
const app = require('../../src/app');
const { User, Department, Student, sequelize } = require('../../src/models');
const { hashPassword } = require('../../src/utils/hash');
const { generateTokens } = require('../../src/utils/jwt');

// Test data
let testDepartment;
let testUser;
let adminUser;
let userToken;
let adminToken;

describe('User Endpoints', () => {
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

        try {
            await sequelize.sync({ force: true });

            testDepartment = await Department.create({
                name: 'Test Department',
                code: 'TEST',
                faculty: 'Test Faculty'
            });

            const passwordHash = await hashPassword('TestPassword123!');

            // Create regular user
            testUser = await User.create({
                email: 'testuser@test.com',
                password_hash: passwordHash,
                role: 'student',
                first_name: 'Test',
                last_name: 'User',
                is_active: true
            });

            await Student.create({
                user_id: testUser.id,
                student_number: 'TEST001',
                department_id: testDepartment.id,
                enrollment_year: 2024
            });

            // Create admin user
            adminUser = await User.create({
                email: 'admin@test.com',
                password_hash: passwordHash,
                role: 'admin',
                first_name: 'Admin',
                last_name: 'User',
                is_active: true
            });

            // Generate tokens
            const userTokens = generateTokens(testUser);
            const adminTokens = generateTokens(adminUser);

            userToken = userTokens.accessToken;
            adminToken = adminTokens.accessToken;

            // Save refresh tokens
            testUser.refresh_token = userTokens.refreshToken;
            await testUser.save();

            adminUser.refresh_token = adminTokens.refreshToken;
            await adminUser.save();
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

    describe('GET /api/v1/users/me', () => {
        it('should get current user profile', async () => {
            const skip = await skipIfNoDb();
            if (skip || !userToken) return;

            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.email).toBe('testuser@test.com');
            expect(res.body.data.password_hash).toBeUndefined(); // Should not include password
        });

        it('should reject unauthenticated request', async () => {
            const res = await request(app)
                .get('/api/v1/users/me');

            expect(res.statusCode).toBe(401);
        });

        it('should reject invalid token', async () => {
            const res = await request(app)
                .get('/api/v1/users/me')
                .set('Authorization', 'Bearer invalid-token');

            expect(res.statusCode).toBe(401);
        });
    });

    describe('PUT /api/v1/users/me', () => {
        it('should update user profile', async () => {
            const skip = await skipIfNoDb();
            if (skip || !userToken) return;

            const res = await request(app)
                .put('/api/v1/users/me')
                .set('Authorization', `Bearer ${userToken}`)
                .send({
                    firstName: 'Updated',
                    lastName: 'Name',
                    phone: '+90 555 123 4567'
                });

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.first_name).toBe('Updated');
        });

        it('should reject empty update', async () => {
            const skip = await skipIfNoDb();
            if (skip || !userToken) return;

            const res = await request(app)
                .put('/api/v1/users/me')
                .set('Authorization', `Bearer ${userToken}`)
                .send({});

            expect(res.statusCode).toBe(400);
        });
    });

    describe('GET /api/v1/users (Admin Only)', () => {
        it('should get user list for admin', async () => {
            const skip = await skipIfNoDb();
            if (skip || !adminToken) return;

            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.users).toBeDefined();
            expect(res.body.data.pagination).toBeDefined();
        });

        it('should reject non-admin users', async () => {
            const skip = await skipIfNoDb();
            if (skip || !userToken) return;

            const res = await request(app)
                .get('/api/v1/users')
                .set('Authorization', `Bearer ${userToken}`);

            expect(res.statusCode).toBe(403);
        });

        it('should support pagination', async () => {
            const skip = await skipIfNoDb();
            if (skip || !adminToken) return;

            const res = await request(app)
                .get('/api/v1/users?page=1&limit=5')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
            expect(res.body.data.pagination.limit).toBe(5);
        });

        it('should support role filtering', async () => {
            const skip = await skipIfNoDb();
            if (skip || !adminToken) return;

            const res = await request(app)
                .get('/api/v1/users?role=student')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.statusCode).toBe(200);
        });
    });

    describe('Health Check', () => {
        it('should return health status', async () => {
            const res = await request(app)
                .get('/api/v1/health');

            expect(res.statusCode).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('running');
        });
    });
});
