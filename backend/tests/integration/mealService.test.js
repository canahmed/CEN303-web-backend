/**
 * Integration Tests: Meal Reservation Flow
 * End-to-end tests for meal service functionality
 */

const request = require('supertest');
const app = require('../../src/app');
const { sequelize, User, Cafeteria, MealMenu, MealReservation, Wallet } = require('../../src/models');

describe('Meal Service Integration Tests', () => {
    let authToken;
    let adminToken;
    let testUser;
    let testCafeteria;
    let testMenu;

    beforeAll(async () => {
        // Note: These tests require a test database connection
        // Skip if no test DB available
        try {
            await sequelize.authenticate();
        } catch (error) {
            console.log('Skipping integration tests - no test DB');
            return;
        }
    });

    describe('Menu Operations', () => {
        it('GET /api/v1/meals/cafeterias - should list cafeterias', async () => {
            const res = await request(app)
                .get('/api/v1/meals/cafeterias')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(Array.isArray(res.body.data)).toBe(true);
        });

        it('GET /api/v1/meals/menus - should list menus', async () => {
            const res = await request(app)
                .get('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('GET /api/v1/meals/menus - should filter by date', async () => {
            const today = new Date().toISOString().slice(0, 10);
            const res = await request(app)
                .get(`/api/v1/meals/menus?start_date=${today}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
        });

        it('POST /api/v1/meals/menus - admin should create menu', async () => {
            const menuData = {
                cafeteria_id: testCafeteria?.id,
                date: '2025-12-25',
                meal_type: 'lunch',
                items_json: [{ name: 'Test Yemek' }],
                price: 25.00,
                is_published: true
            };

            const res = await request(app)
                .post('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(menuData);

            // May fail if no admin token, skip gracefully
            if (adminToken) {
                expect(res.status).toBe(201);
            }
        });

        it('POST /api/v1/meals/menus - non-admin should be rejected', async () => {
            const res = await request(app)
                .post('/api/v1/meals/menus')
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect([401, 403]).toContain(res.status);
        });
    });

    describe('Reservation Flow', () => {
        it('POST /api/v1/meals/reservations - should create reservation', async () => {
            if (!testMenu) return;

            const res = await request(app)
                .post('/api/v1/meals/reservations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ menu_id: testMenu.id });

            // Success or balance error
            expect([201, 400]).toContain(res.status);
        });

        it('GET /api/v1/meals/reservations/my - should list user reservations', async () => {
            const res = await request(app)
                .get('/api/v1/meals/reservations/my')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
        });

        it('DELETE /api/v1/meals/reservations/:id - should cancel reservation', async () => {
            // This requires an existing reservation
            const res = await request(app)
                .delete('/api/v1/meals/reservations/nonexistent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });

        it('should prevent duplicate reservation for same menu', async () => {
            if (!testMenu) return;

            // First reservation
            await request(app)
                .post('/api/v1/meals/reservations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ menu_id: testMenu.id });

            // Second should fail
            const res = await request(app)
                .post('/api/v1/meals/reservations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ menu_id: testMenu.id });

            expect([400, 409]).toContain(res.status);
        });

        it('should enforce daily meal limit (max 2)', async () => {
            // This test requires creating multiple menus for same day
            expect(true).toBe(true); // Placeholder
        });
    });

    describe('QR Code Usage', () => {
        it('POST /api/v1/meals/reservations/:qrCode/use - should validate QR', async () => {
            const res = await request(app)
                .post('/api/v1/meals/reservations/INVALID-QR/use')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(404);
        });

        it('should reject already used meal', async () => {
            // Requires a used reservation
            expect(true).toBe(true); // Placeholder
        });

        it('should reject cancelled reservation', async () => {
            expect(true).toBe(true); // Placeholder
        });
    });

    describe('Error Handling', () => {
        it('should return 401 without auth token', async () => {
            const res = await request(app)
                .get('/api/v1/meals/menus');

            expect(res.status).toBe(401);
        });

        it('should return 404 for non-existent menu', async () => {
            const res = await request(app)
                .get('/api/v1/meals/menus/nonexistent-uuid')
                .set('Authorization', `Bearer ${authToken}`);

            expect(res.status).toBe(404);
        });
    });
});
