/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Yeni kullanıcı kaydı
 *     description: |
 *       Yeni bir kullanıcı (öğrenci veya öğretim üyesi) kaydı oluşturur.
 *       Kayıt sonrası email doğrulama linki gönderilir.
 *       
 *       **Öğrenci kaydı için**: studentNumber alanı zorunludur
 *       **Öğretim üyesi kaydı için**: employeeNumber ve title alanları zorunludur
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           examples:
 *             student:
 *               summary: Öğrenci kaydı
 *               value:
 *                 email: "ogrenci@university.edu.tr"
 *                 password: "Password123"
 *                 confirmPassword: "Password123"
 *                 firstName: "Ahmet"
 *                 lastName: "Yılmaz"
 *                 role: "student"
 *                 phone: "+90 532 123 4567"
 *                 departmentId: "123e4567-e89b-12d3-a456-426614174000"
 *                 studentNumber: "2020123456"
 *             faculty:
 *               summary: Öğretim üyesi kaydı
 *               value:
 *                 email: "hoca@university.edu.tr"
 *                 password: "Password123"
 *                 confirmPassword: "Password123"
 *                 firstName: "Mehmet"
 *                 lastName: "Demir"
 *                 role: "faculty"
 *                 phone: "+90 532 987 6543"
 *                 departmentId: "123e4567-e89b-12d3-a456-426614174000"
 *                 employeeNumber: "EMP001"
 *                 title: "Dr. Öğr. Üyesi"
 *     responses:
 *       201:
 *         description: Kayıt başarılı, email doğrulama linki gönderildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Kayıt başarılı. Lütfen email adresinizi doğrulayın."
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Validasyon hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "VALIDATION_ERROR"
 *                 message: "Şifre en az 8 karakter, 1 büyük harf, 1 küçük harf ve 1 rakam içermelidir"
 *       409:
 *         description: Email zaten kayıtlı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "EMAIL_EXISTS"
 *                 message: "Bu email adresi zaten kayıtlı"
 */

/**
 * @swagger
 * /api/v1/auth/verify-email:
 *   post:
 *     summary: Email doğrulama
 *     description: |
 *       Kayıt sonrası gönderilen email doğrulama linkindeki token ile hesabı aktifleştirir.
 *       Token 24 saat geçerlidir.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailRequest'
 *     responses:
 *       200:
 *         description: Email doğrulama başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Email başarıyla doğrulandı. Artık giriş yapabilirsiniz."
 *       400:
 *         description: Geçersiz veya süresi dolmuş token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "INVALID_TOKEN"
 *                 message: "Geçersiz veya süresi dolmuş doğrulama token'ı"
 */

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Kullanıcı girişi
 *     description: |
 *       Email ve şifre ile giriş yapar.
 *       Başarılı giriş sonrası access token (15 dk) ve refresh token (7 gün) döner.
 *       
 *       **Önemli**: Hesabın aktif olması için email doğrulaması yapılmış olmalıdır.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Giriş başarılı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Validasyon hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Geçersiz kimlik bilgileri
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "INVALID_CREDENTIALS"
 *                 message: "Email veya şifre hatalı"
 *       403:
 *         description: Hesap aktif değil
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "ACCOUNT_NOT_ACTIVE"
 *                 message: "Hesabınız henüz aktifleştirilmemiş. Lütfen email adresinizi doğrulayın."
 */

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Access token yenileme
 *     description: |
 *       Refresh token kullanarak yeni bir access token alır.
 *       Access token süresi dolduğunda bu endpoint kullanılmalıdır.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token yenileme başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Geçersiz veya süresi dolmuş refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "INVALID_REFRESH_TOKEN"
 *                 message: "Geçersiz veya süresi dolmuş refresh token"
 */

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Çıkış yapma
 *     description: |
 *       Kullanıcı oturumunu sonlandırır ve refresh token'ı geçersiz kılar.
 *       Bu endpoint'e erişmek için geçerli bir access token gereklidir.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Çıkış başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Başarıyla çıkış yapıldı"
 *       401:
 *         description: Kimlik doğrulama gerekli
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "UNAUTHORIZED"
 *                 message: "Kimlik doğrulama gerekli"
 */

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Şifre sıfırlama isteği
 *     description: |
 *       Belirtilen email adresine şifre sıfırlama linki gönderir.
 *       Link 24 saat geçerlidir.
 *       
 *       **Güvenlik notu**: Email kayıtlı olmasa bile başarılı yanıt döner (email enumeration koruması).
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Şifre sıfırlama linki gönderildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Şifre sıfırlama linki email adresinize gönderildi"
 *       400:
 *         description: Validasyon hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Şifre sıfırlama
 *     description: |
 *       Email ile gönderilen token kullanarak yeni şifre belirler.
 *       Token 24 saat geçerlidir.
 *       
 *       **Önemli**: Şifre sıfırlandığında tüm aktif oturumlar sonlandırılır.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Şifre başarıyla sıfırlandı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: string
 *                       example: "Şifreniz başarıyla değiştirildi. Yeni şifrenizle giriş yapabilirsiniz."
 *       400:
 *         description: Geçersiz veya süresi dolmuş token / Validasyon hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "INVALID_TOKEN"
 *                 message: "Geçersiz veya süresi dolmuş şifre sıfırlama token'ı"
 */

module.exports = {};
