const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Smart Campus API',
            version: '1.0.0',
            description: `
## Akıllı Kampüs Ekosistem Yönetim Platformu - Backend API

Bu API, üniversite kampüsünün günlük operasyonlarını dijitalleştiren ve optimize eden kapsamlı bir web uygulamasının backend servisidir.

### Part 1 - Kimlik Doğrulama ve Kullanıcı Yönetimi
- **Authentication**: Kayıt, giriş, çıkış, token yenileme, şifre sıfırlama
- **User Management**: Profil görüntüleme, güncelleme, profil fotoğrafı yükleme
- **Departments**: Bölüm listeleme

### Part 2 - Akademik Yönetim ve GPS Yoklama
- **Courses**: Ders yönetimi (CRUD, önkoşullar)
- **Sections**: Ders şubeleri yönetimi
- **Enrollments**: Derse kayıt, bırakma, önkoşul ve çakışma kontrolü
- **Grades**: Not girişi, GPA/CGPA, transkript ve PDF
- **Attendance**: GPS tabanlı yoklama, QR kod, mazeret yönetimi

### Part 3 - Yemek Servisi, Etkinlik ve Çizelgeleme
- **Meals**: Yemekhane menüleri, rezervasyon, QR ile kullanım
- **Wallet**: Cüzdan bakiyesi, para yükleme, işlem geçmişi
- **Events**: Kampüs etkinlikleri, kayıt, QR check-in
- **Scheduling**: Ders programı, iCal export
- **Reservations**: Derslik rezervasyonu, onay sistemi

### Kimlik Doğrulama
API, JWT (JSON Web Token) tabanlı kimlik doğrulama kullanır:
- **Access Token**: 15 dakika geçerli
- **Refresh Token**: 7 gün geçerli
            `,
            contact: {
                name: 'Smart Campus Team',
                email: 'support@smartcampus.com'
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT'
            }
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server'
            },
            {
                url: 'https://smart-campus-api-g53d.onrender.com',
                description: 'Production Server'
            }
        ],
        tags: [
            // Part 1 Tags
            {
                name: 'Authentication',
                description: 'Kimlik doğrulama işlemleri (kayıt, giriş, çıkış, token yenileme, şifre sıfırlama)'
            },
            {
                name: 'Users',
                description: 'Kullanıcı yönetimi işlemleri (profil, fotoğraf yükleme, şifre değiştirme)'
            },
            {
                name: 'Departments',
                description: 'Bölüm listeleme işlemleri'
            },
            // Part 2 Tags
            {
                name: 'Courses',
                description: 'Ders yönetimi (listeleme, oluşturma, güncelleme, silme, önkoşullar)'
            },
            {
                name: 'Sections',
                description: 'Ders şubesi yönetimi (section CRUD, kapasite, program)'
            },
            {
                name: 'Enrollments',
                description: 'Ders kayıt işlemleri (kayıt olma, bırakma, önkoşul/çakışma kontrolü)'
            },
            {
                name: 'Grades',
                description: 'Not yönetimi (not girişi, GPA/CGPA hesaplama, transkript, PDF)'
            },
            {
                name: 'Attendance',
                description: 'Yoklama sistemi (GPS tabanlı, QR kod, mazeret yönetimi)'
            },
            // Part 3 Tags
            {
                name: 'Meals',
                description: 'Yemek servisi (menü listeleme, rezervasyon, QR ile kullanım)'
            },
            {
                name: 'Wallet',
                description: 'Cüzdan işlemleri (bakiye, para yükleme, işlem geçmişi)'
            },
            {
                name: 'Events',
                description: 'Etkinlik yönetimi (listeleme, kayıt olma, QR check-in)'
            },
            {
                name: 'Scheduling',
                description: 'Ders programı (haftalık program, iCal export)'
            },
            {
                name: 'Reservations',
                description: 'Derslik rezervasyonu (talep oluşturma, onay/red)'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'JWT Access Token. Login endpoint\'inden alınır.'
                }
            },
            schemas: {
                // Error Response
                ErrorResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false
                        },
                        error: {
                            type: 'object',
                            properties: {
                                code: {
                                    type: 'string',
                                    example: 'ERROR_CODE'
                                },
                                message: {
                                    type: 'string',
                                    example: 'Hata açıklaması'
                                }
                            }
                        }
                    }
                },
                // User Schema
                User: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'ogrenci@university.edu.tr'
                        },
                        role: {
                            type: 'string',
                            enum: ['student', 'faculty', 'admin'],
                            example: 'student'
                        },
                        first_name: {
                            type: 'string',
                            example: 'Ahmet'
                        },
                        last_name: {
                            type: 'string',
                            example: 'Yılmaz'
                        },
                        phone: {
                            type: 'string',
                            example: '+90 532 123 4567'
                        },
                        profile_picture_url: {
                            type: 'string',
                            nullable: true,
                            example: '/uploads/profiles/1701234567890-avatar.jpg'
                        },
                        is_active: {
                            type: 'boolean',
                            example: true
                        },
                        createdAt: {
                            type: 'string',
                            format: 'date-time'
                        },
                        updatedAt: {
                            type: 'string',
                            format: 'date-time'
                        }
                    }
                },
                // Student Schema
                Student: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        user_id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        student_number: {
                            type: 'string',
                            example: '2020123456'
                        },
                        department_id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        enrollment_year: {
                            type: 'integer',
                            example: 2020
                        },
                        gpa: {
                            type: 'number',
                            format: 'float',
                            example: 3.25
                        },
                        cgpa: {
                            type: 'number',
                            format: 'float',
                            example: 3.10
                        }
                    }
                },
                // Faculty Schema
                Faculty: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        user_id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        employee_number: {
                            type: 'string',
                            example: 'EMP001'
                        },
                        title: {
                            type: 'string',
                            example: 'Dr. Öğr. Üyesi'
                        },
                        department_id: {
                            type: 'string',
                            format: 'uuid'
                        },
                        office_location: {
                            type: 'string',
                            example: 'A Blok Kat 3 No: 305'
                        }
                    }
                },
                // Department Schema
                Department: {
                    type: 'object',
                    properties: {
                        id: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        name: {
                            type: 'string',
                            example: 'Bilgisayar Mühendisliği'
                        },
                        code: {
                            type: 'string',
                            example: 'BLM'
                        },
                        faculty: {
                            type: 'string',
                            example: 'Mühendislik Fakültesi'
                        }
                    }
                },
                // Register Request
                RegisterRequest: {
                    type: 'object',
                    required: ['email', 'password', 'confirmPassword', 'firstName', 'lastName', 'role', 'departmentId'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'ogrenci@university.edu.tr'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            description: 'En az 8 karakter, 1 büyük harf, 1 küçük harf, 1 rakam',
                            example: 'Password123'
                        },
                        confirmPassword: {
                            type: 'string',
                            format: 'password',
                            example: 'Password123'
                        },
                        firstName: {
                            type: 'string',
                            minLength: 2,
                            example: 'Ahmet'
                        },
                        lastName: {
                            type: 'string',
                            minLength: 2,
                            example: 'Yılmaz'
                        },
                        role: {
                            type: 'string',
                            enum: ['student', 'faculty'],
                            example: 'student'
                        },
                        phone: {
                            type: 'string',
                            example: '+90 532 123 4567'
                        },
                        departmentId: {
                            type: 'string',
                            format: 'uuid',
                            example: '123e4567-e89b-12d3-a456-426614174000'
                        },
                        studentNumber: {
                            type: 'string',
                            description: 'Sadece student rolü için zorunlu',
                            example: '2020123456'
                        },
                        employeeNumber: {
                            type: 'string',
                            description: 'Sadece faculty rolü için zorunlu',
                            example: 'EMP001'
                        },
                        title: {
                            type: 'string',
                            description: 'Sadece faculty rolü için zorunlu',
                            example: 'Dr. Öğr. Üyesi'
                        }
                    }
                },
                // Login Request
                LoginRequest: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'ogrenci@university.edu.tr'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            example: 'Password123'
                        }
                    }
                },
                // Login Response
                LoginResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object',
                            properties: {
                                accessToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                refreshToken: {
                                    type: 'string',
                                    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                                },
                                user: {
                                    $ref: '#/components/schemas/User'
                                }
                            }
                        }
                    }
                },
                // Refresh Token Request
                RefreshTokenRequest: {
                    type: 'object',
                    required: ['refreshToken'],
                    properties: {
                        refreshToken: {
                            type: 'string',
                            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                        }
                    }
                },
                // Verify Email Request
                VerifyEmailRequest: {
                    type: 'object',
                    required: ['token'],
                    properties: {
                        token: {
                            type: 'string',
                            example: 'abc123def456...'
                        }
                    }
                },
                // Forgot Password Request
                ForgotPasswordRequest: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: {
                            type: 'string',
                            format: 'email',
                            example: 'ogrenci@university.edu.tr'
                        }
                    }
                },
                // Reset Password Request
                ResetPasswordRequest: {
                    type: 'object',
                    required: ['token', 'password', 'confirmPassword'],
                    properties: {
                        token: {
                            type: 'string',
                            example: 'abc123def456...'
                        },
                        password: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            example: 'NewPassword123'
                        },
                        confirmPassword: {
                            type: 'string',
                            format: 'password',
                            example: 'NewPassword123'
                        }
                    }
                },
                // Update Profile Request
                UpdateProfileRequest: {
                    type: 'object',
                    minProperties: 1,
                    properties: {
                        firstName: {
                            type: 'string',
                            minLength: 2,
                            example: 'Mehmet'
                        },
                        lastName: {
                            type: 'string',
                            minLength: 2,
                            example: 'Kaya'
                        },
                        phone: {
                            type: 'string',
                            example: '+90 533 999 8877'
                        }
                    }
                },
                // Change Password Request
                ChangePasswordRequest: {
                    type: 'object',
                    required: ['currentPassword', 'newPassword', 'confirmPassword'],
                    properties: {
                        currentPassword: {
                            type: 'string',
                            format: 'password',
                            example: 'OldPassword123'
                        },
                        newPassword: {
                            type: 'string',
                            format: 'password',
                            minLength: 8,
                            example: 'NewPassword456'
                        },
                        confirmPassword: {
                            type: 'string',
                            format: 'password',
                            example: 'NewPassword456'
                        }
                    }
                },
                // User List Response
                UserListResponse: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: true
                        },
                        data: {
                            type: 'object',
                            properties: {
                                users: {
                                    type: 'array',
                                    items: {
                                        $ref: '#/components/schemas/User'
                                    }
                                },
                                pagination: {
                                    type: 'object',
                                    properties: {
                                        page: {
                                            type: 'integer',
                                            example: 1
                                        },
                                        limit: {
                                            type: 'integer',
                                            example: 10
                                        },
                                        total: {
                                            type: 'integer',
                                            example: 50
                                        },
                                        totalPages: {
                                            type: 'integer',
                                            example: 5
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js', './src/swagger/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
