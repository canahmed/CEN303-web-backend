// Jest test setup file
require('dotenv').config({ path: '.env.example' });

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only';
process.env.DB_NAME = 'campus_test_db';

// Increase timeout for async operations
jest.setTimeout(30000);

// Mock console.log in tests to reduce noise
// global.console = {
//   ...console,
//   log: jest.fn(),
// };

// Clean up after all tests
afterAll(async () => {
    // Close any open connections
    const { sequelize } = require('../src/models');
    await sequelize.close();
});
