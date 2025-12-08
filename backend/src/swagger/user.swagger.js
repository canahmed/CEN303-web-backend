/**
 * @swagger
 * /api/v1/users/me:
 *   get:
 *     summary: Kullanıcı profilini görüntüleme
 *     description: |
 *       Giriş yapmış kullanıcının profil bilgilerini döner.
 *       Öğrenci veya öğretim üyesi bilgileri de dahil edilir.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil bilgileri başarıyla alındı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         student:
 *                           $ref: '#/components/schemas/Student'
 *                         faculty:
 *                           $ref: '#/components/schemas/Faculty'
 *             examples:
 *               student:
 *                 summary: Öğrenci profili
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     email: "ogrenci@university.edu.tr"
 *                     role: "student"
 *                     first_name: "Ahmet"
 *                     last_name: "Yılmaz"
 *                     phone: "+90 532 123 4567"
 *                     profile_picture_url: "/uploads/profiles/avatar.jpg"
 *                     is_active: true
 *                     student:
 *                       id: "456e7890-e89b-12d3-a456-426614174000"
 *                       student_number: "2020123456"
 *                       enrollment_year: 2020
 *                       gpa: 3.25
 *                       cgpa: 3.10
 *                       department:
 *                         id: "789e0123-e89b-12d3-a456-426614174000"
 *                         name: "Bilgisayar Mühendisliği"
 *                         code: "BLM"
 *               faculty:
 *                 summary: Öğretim üyesi profili
 *                 value:
 *                   success: true
 *                   data:
 *                     id: "123e4567-e89b-12d3-a456-426614174000"
 *                     email: "hoca@university.edu.tr"
 *                     role: "faculty"
 *                     first_name: "Mehmet"
 *                     last_name: "Demir"
 *                     phone: "+90 532 987 6543"
 *                     is_active: true
 *                     faculty:
 *                       id: "456e7890-e89b-12d3-a456-426614174000"
 *                       employee_number: "EMP001"
 *                       title: "Dr. Öğr. Üyesi"
 *                       office_location: "A Blok Kat 3 No: 305"
 *                       department:
 *                         id: "789e0123-e89b-12d3-a456-426614174000"
 *                         name: "Bilgisayar Mühendisliği"
 *                         code: "BLM"
 *       401:
 *         description: Kimlik doğrulama gerekli
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *
 *   put:
 *     summary: Kullanıcı profilini güncelleme
 *     description: |
 *       Giriş yapmış kullanıcının profil bilgilerini günceller.
 *       En az bir alan gönderilmelidir.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *           example:
 *             firstName: "Mehmet"
 *             lastName: "Kaya"
 *             phone: "+90 533 999 8877"
 *     responses:
 *       200:
 *         description: Profil başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
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
 *                 message: "En az bir alan güncellenmelidir"
 *       401:
 *         description: Kimlik doğrulama gerekli
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/users/me/profile-picture:
 *   post:
 *     summary: Profil fotoğrafı yükleme
 *     description: |
 *       Kullanıcının profil fotoğrafını yükler veya günceller.
 *       
 *       **Dosya gereksinimleri**:
 *       - Format: JPEG, PNG
 *       - Maksimum boyut: 5MB
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - profilePicture
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *                 description: Profil fotoğrafı dosyası (JPEG/PNG, max 5MB)
 *     responses:
 *       200:
 *         description: Profil fotoğrafı başarıyla yüklendi
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
 *                       example: "Profil fotoğrafı başarıyla yüklendi"
 *                     profilePictureUrl:
 *                       type: string
 *                       example: "/uploads/profiles/1701234567890-avatar.jpg"
 *       400:
 *         description: Dosya yüklenmedi veya geçersiz format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               no_file:
 *                 summary: Dosya yüklenmedi
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "NO_FILE"
 *                     message: "Dosya yüklenmedi"
 *               invalid_type:
 *                 summary: Geçersiz dosya tipi
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "INVALID_FILE_TYPE"
 *                     message: "Sadece JPEG ve PNG dosyaları kabul edilir"
 *               file_too_large:
 *                 summary: Dosya çok büyük
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "FILE_TOO_LARGE"
 *                     message: "Dosya boyutu 5MB'dan büyük olamaz"
 *       401:
 *         description: Kimlik doğrulama gerekli
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/users/me/password:
 *   put:
 *     summary: Şifre değiştirme
 *     description: |
 *       Giriş yapmış kullanıcının şifresini değiştirir.
 *       Mevcut şifrenin doğrulanması gereklidir.
 *       
 *       **Yeni şifre gereksinimleri**:
 *       - En az 8 karakter
 *       - En az 1 büyük harf
 *       - En az 1 küçük harf
 *       - En az 1 rakam
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Şifre başarıyla değiştirildi
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
 *                       example: "Şifreniz başarıyla değiştirildi"
 *       400:
 *         description: Validasyon hatası veya mevcut şifre yanlış
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               wrong_password:
 *                 summary: Mevcut şifre yanlış
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "INVALID_PASSWORD"
 *                     message: "Mevcut şifre yanlış"
 *               password_mismatch:
 *                 summary: Şifreler eşleşmiyor
 *                 value:
 *                   success: false
 *                   error:
 *                     code: "VALIDATION_ERROR"
 *                     message: "Şifreler eşleşmiyor"
 *       401:
 *         description: Kimlik doğrulama gerekli
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     summary: Kullanıcı listesi (Sadece Admin)
 *     description: |
 *       Tüm kullanıcıları listeler. Sadece admin kullanıcıları erişebilir.
 *       
 *       **Sayfalama ve Filtreleme**:
 *       - Varsayılan sayfa: 1
 *       - Varsayılan limit: 10 (max 100)
 *       - Rol, bölüm ve arama ile filtreleme yapılabilir
 *       - Sıralama: createdAt, firstName, lastName, email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Sayfa başına kayıt sayısı
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [student, faculty, admin]
 *         description: Kullanıcı rolüne göre filtreleme
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bölüm ID'sine göre filtreleme
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: İsim veya email'de arama
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, firstName, lastName, email]
 *           default: createdAt
 *         description: Sıralama alanı
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sıralama yönü
 *     responses:
 *       200:
 *         description: Kullanıcı listesi başarıyla alındı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserListResponse'
 *       401:
 *         description: Kimlik doğrulama gerekli
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Yetki yok (admin değil)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "FORBIDDEN"
 *                 message: "Bu işlem için yetkiniz yok"
 */

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     summary: Kullanıcı detayı (Sadece Admin)
 *     description: |
 *       Belirtilen ID'ye sahip kullanıcının detaylı bilgilerini döner.
 *       Sadece admin kullanıcıları erişebilir.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Kullanıcı ID
 *     responses:
 *       200:
 *         description: Kullanıcı bilgileri başarıyla alındı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/User'
 *                     - type: object
 *                       properties:
 *                         student:
 *                           $ref: '#/components/schemas/Student'
 *                         faculty:
 *                           $ref: '#/components/schemas/Faculty'
 *       401:
 *         description: Kimlik doğrulama gerekli
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Yetki yok (admin değil)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Kullanıcı bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "NOT_FOUND"
 *                 message: "Kullanıcı bulunamadı"
 */

module.exports = {};
