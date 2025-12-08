const {
    registerSchema,
    loginSchema,
    verifyEmailSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema
} = require('../../src/validations/authValidation');

const {
    updateProfileSchema,
    changePasswordSchema,
    userListQuerySchema
} = require('../../src/validations/userValidation');

describe('Auth Validation Schemas', () => {
    describe('registerSchema', () => {
        const validStudentData = {
            email: 'test@example.com',
            password: 'Password123!',
            confirmPassword: 'Password123!',
            firstName: 'John',
            lastName: 'Doe',
            role: 'student',
            studentNumber: '2021001',
            departmentId: '123e4567-e89b-12d3-a456-426614174000'
        };

        it('should validate correct student registration data', () => {
            const { error } = registerSchema.validate(validStudentData);
            expect(error).toBeUndefined();
        });

        it('should reject invalid email', () => {
            const { error } = registerSchema.validate({
                ...validStudentData,
                email: 'invalid-email'
            });
            expect(error).toBeDefined();
        });

        it('should reject weak password', () => {
            const { error } = registerSchema.validate({
                ...validStudentData,
                password: '123456',
                confirmPassword: '123456'
            });
            expect(error).toBeDefined();
        });

        it('should reject mismatched passwords', () => {
            const { error } = registerSchema.validate({
                ...validStudentData,
                confirmPassword: 'DifferentPassword123!'
            });
            expect(error).toBeDefined();
        });

        it('should require studentNumber for student role', () => {
            const data = { ...validStudentData };
            delete data.studentNumber;
            const { error } = registerSchema.validate(data);
            expect(error).toBeDefined();
        });

        it('should validate faculty registration', () => {
            const facultyData = {
                email: 'faculty@example.com',
                password: 'Password123!',
                confirmPassword: 'Password123!',
                firstName: 'Jane',
                lastName: 'Prof',
                role: 'faculty',
                employeeNumber: 'FAC001',
                title: 'Dr.',
                departmentId: '123e4567-e89b-12d3-a456-426614174000'
            };
            const { error } = registerSchema.validate(facultyData);
            expect(error).toBeUndefined();
        });
    });

    describe('loginSchema', () => {
        it('should validate correct login data', () => {
            const { error } = loginSchema.validate({
                email: 'test@example.com',
                password: 'Password123!'
            });
            expect(error).toBeUndefined();
        });

        it('should reject missing email', () => {
            const { error } = loginSchema.validate({
                password: 'Password123!'
            });
            expect(error).toBeDefined();
        });

        it('should reject missing password', () => {
            const { error } = loginSchema.validate({
                email: 'test@example.com'
            });
            expect(error).toBeDefined();
        });
    });

    describe('verifyEmailSchema', () => {
        it('should validate token', () => {
            const { error } = verifyEmailSchema.validate({
                token: 'some-verification-token'
            });
            expect(error).toBeUndefined();
        });

        it('should reject missing token', () => {
            const { error } = verifyEmailSchema.validate({});
            expect(error).toBeDefined();
        });
    });

    describe('forgotPasswordSchema', () => {
        it('should validate email', () => {
            const { error } = forgotPasswordSchema.validate({
                email: 'test@example.com'
            });
            expect(error).toBeUndefined();
        });
    });

    describe('resetPasswordSchema', () => {
        it('should validate reset data', () => {
            const { error } = resetPasswordSchema.validate({
                token: 'reset-token',
                password: 'NewPassword123!',
                confirmPassword: 'NewPassword123!'
            });
            expect(error).toBeUndefined();
        });
    });

    describe('refreshTokenSchema', () => {
        it('should validate refresh token', () => {
            const { error } = refreshTokenSchema.validate({
                refreshToken: 'some-refresh-token'
            });
            expect(error).toBeUndefined();
        });
    });
});

describe('User Validation Schemas', () => {
    describe('updateProfileSchema', () => {
        it('should validate profile update', () => {
            const { error } = updateProfileSchema.validate({
                firstName: 'Updated',
                lastName: 'Name'
            });
            expect(error).toBeUndefined();
        });

        it('should allow partial update', () => {
            const { error } = updateProfileSchema.validate({
                firstName: 'Updated'
            });
            expect(error).toBeUndefined();
        });

        it('should reject empty update', () => {
            const { error } = updateProfileSchema.validate({});
            expect(error).toBeDefined();
        });
    });

    describe('changePasswordSchema', () => {
        it('should validate password change', () => {
            const { error } = changePasswordSchema.validate({
                currentPassword: 'OldPassword123!',
                newPassword: 'NewPassword123!',
                confirmPassword: 'NewPassword123!'
            });
            expect(error).toBeUndefined();
        });
    });

    describe('userListQuerySchema', () => {
        it('should validate query params with defaults', () => {
            const { error, value } = userListQuerySchema.validate({});
            expect(error).toBeUndefined();
            expect(value.page).toBe(1);
            expect(value.limit).toBe(10);
        });

        it('should validate custom query params', () => {
            const { error, value } = userListQuerySchema.validate({
                page: 2,
                limit: 20,
                role: 'student',
                sortBy: 'firstName',
                sortOrder: 'asc'
            });
            expect(error).toBeUndefined();
            expect(value.page).toBe(2);
        });
    });
});
