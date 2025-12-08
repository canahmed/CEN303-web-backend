const { hashPassword, comparePassword } = require('../../src/utils/hash');
const { generateTokens, verifyToken, generateAccessToken, generateRefreshToken } = require('../../src/utils/jwt');
const ApiError = require('../../src/utils/ApiError');

describe('Hash Utilities', () => {
    describe('hashPassword', () => {
        it('should hash a password', async () => {
            const password = 'TestPassword123!';
            const hash = await hashPassword(password);

            expect(hash).toBeDefined();
            expect(hash).not.toBe(password);
            expect(hash.length).toBeGreaterThan(50);
        });

        it('should generate different hashes for same password', async () => {
            const password = 'TestPassword123!';
            const hash1 = await hashPassword(password);
            const hash2 = await hashPassword(password);

            expect(hash1).not.toBe(hash2);
        });
    });

    describe('comparePassword', () => {
        it('should return true for matching password', async () => {
            const password = 'TestPassword123!';
            const hash = await hashPassword(password);
            const isMatch = await comparePassword(password, hash);

            expect(isMatch).toBe(true);
        });

        it('should return false for non-matching password', async () => {
            const password = 'TestPassword123!';
            const wrongPassword = 'WrongPassword123!';
            const hash = await hashPassword(password);
            const isMatch = await comparePassword(wrongPassword, hash);

            expect(isMatch).toBe(false);
        });
    });
});

describe('JWT Utilities', () => {
    const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        role: 'student'
    };

    describe('generateAccessToken', () => {
        it('should generate a valid access token', () => {
            const token = generateAccessToken(mockUser);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
            expect(token.split('.')).toHaveLength(3); // JWT format
        });
    });

    describe('generateRefreshToken', () => {
        it('should generate a valid refresh token', () => {
            const token = generateRefreshToken(mockUser);

            expect(token).toBeDefined();
            expect(typeof token).toBe('string');
        });
    });

    describe('generateTokens', () => {
        it('should generate both access and refresh tokens', () => {
            const tokens = generateTokens(mockUser);

            expect(tokens.accessToken).toBeDefined();
            expect(tokens.refreshToken).toBeDefined();
        });
    });

    describe('verifyToken', () => {
        it('should verify a valid token', () => {
            const token = generateAccessToken(mockUser);
            const decoded = verifyToken(token);

            expect(decoded.id).toBe(mockUser.id);
            expect(decoded.email).toBe(mockUser.email);
            expect(decoded.role).toBe(mockUser.role);
        });

        it('should throw error for invalid token', () => {
            expect(() => verifyToken('invalid-token')).toThrow();
        });
    });
});

describe('ApiError', () => {
    describe('constructor', () => {
        it('should create an error with statusCode and message', () => {
            const error = new ApiError(400, 'Bad request');

            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Bad request');
            expect(error.status).toBe('fail');
        });

        it('should set status to error for 5xx codes', () => {
            const error = new ApiError(500, 'Server error');

            expect(error.status).toBe('error');
        });
    });

    describe('static factory methods', () => {
        it('should create badRequest error', () => {
            const error = ApiError.badRequest('Invalid input');

            expect(error.statusCode).toBe(400);
            expect(error.message).toBe('Invalid input');
        });

        it('should create unauthorized error', () => {
            const error = ApiError.unauthorized();

            expect(error.statusCode).toBe(401);
        });

        it('should create forbidden error', () => {
            const error = ApiError.forbidden();

            expect(error.statusCode).toBe(403);
        });

        it('should create notFound error', () => {
            const error = ApiError.notFound('Resource not found');

            expect(error.statusCode).toBe(404);
        });

        it('should create conflict error', () => {
            const error = ApiError.conflict('Already exists');

            expect(error.statusCode).toBe(409);
        });

        it('should create internal error', () => {
            const error = ApiError.internal();

            expect(error.statusCode).toBe(500);
        });
    });
});
