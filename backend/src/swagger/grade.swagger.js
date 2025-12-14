/**
 * @swagger
 * /api/v1/grades/my-grades:
 *   get:
 *     tags: [Grades]
 *     summary: Notlarım
 *     description: Öğrencinin tüm derslerindeki notlarını getirir.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       course_code:
 *                         type: string
 *                       course_name:
 *                         type: string
 *                       midterm_grade:
 *                         type: number
 *                       final_grade:
 *                         type: number
 *                       letter_grade:
 *                         type: string
 *                       grade_point:
 *                         type: number
 *       401:
 *         description: Yetkilendirme hatası
 *
 * /api/v1/grades/transcript:
 *   get:
 *     tags: [Grades]
 *     summary: Transkript (JSON)
 *     description: Öğrencinin akademik transkriptini JSON formatında döndürür.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     student:
 *                       type: object
 *                       properties:
 *                         studentNumber:
 *                           type: string
 *                         firstName:
 *                           type: string
 *                         lastName:
 *                           type: string
 *                         department:
 *                           type: string
 *                     semesters:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           year:
 *                             type: integer
 *                           semester:
 *                             type: string
 *                           gpa:
 *                             type: number
 *                           courses:
 *                             type: array
 *                     cgpa:
 *                       type: number
 *                       description: Cumulative GPA
 *
 * /api/v1/grades/transcript/pdf:
 *   get:
 *     tags: [Grades]
 *     summary: Transkript (PDF)
 *     description: |
 *       Öğrencinin akademik transkriptini PDF formatında indirir.
 *       Profesyonel formatlı, üniversite başlıklı resmi belge.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: PDF dosyası
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Yetkilendirme hatası
 *
 * /api/v1/grades:
 *   post:
 *     tags: [Grades]
 *     summary: Not girişi
 *     description: |
 *       Öğrencinin dersine not girer. Sadece dersin eğitmeni girebilir.
 *       - Harf notu otomatik hesaplanır
 *       - GPA/CGPA güncellenir
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [enrollment_id, midterm_grade, final_grade]
 *             properties:
 *               enrollment_id:
 *                 type: string
 *                 format: uuid
 *               midterm_grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 75
 *               final_grade:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 example: 85
 *     responses:
 *       200:
 *         description: Not girildi
 *       403:
 *         description: Bu dersin eğitmeni değilsiniz
 *       404:
 *         description: Kayıt bulunamadı
 *
 * /api/v1/grades/bulk:
 *   post:
 *     tags: [Grades]
 *     summary: Toplu not girişi
 *     description: Birden fazla öğrenciye aynı anda not girer.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [grades]
 *             properties:
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     enrollment_id:
 *                       type: string
 *                       format: uuid
 *                     midterm_grade:
 *                       type: number
 *                     final_grade:
 *                       type: number
 *     responses:
 *       200:
 *         description: Notlar girildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                     errors:
 *                       type: array
 */
