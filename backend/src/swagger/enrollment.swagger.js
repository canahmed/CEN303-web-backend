/**
 * @swagger
 * /api/v1/enrollments:
 *   post:
 *     tags: [Enrollments]
 *     summary: Derse kayıt ol
 *     description: |
 *       Öğrenciyi belirtilen section'a kaydeder.
 *       - Önkoşul kontrolü yapılır (recursive)
 *       - Ders programı çakışması kontrol edilir
 *       - Kapasite kontrolü yapılır (atomic)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [section_id]
 *             properties:
 *               section_id:
 *                 type: string
 *                 format: uuid
 *                 description: Kayıt olunacak section ID
 *     responses:
 *       201:
 *         description: Kayıt başarılı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Enrollment'
 *       400:
 *         description: |
 *           Kayıt başarısız. Nedenler:
 *           - Önkoşullar karşılanmadı
 *           - Ders programı çakışması
 *           - Zaten kayıtlı
 *       403:
 *         description: Kapasite dolu
 *       401:
 *         description: Yetkilendirme hatası
 *
 * /api/v1/enrollments/{id}:
 *   delete:
 *     tags: [Enrollments]
 *     summary: Dersi bırak
 *     description: |
 *       Öğrenciyi belirtilen dersten çıkarır.
 *       - İlk 4 hafta içinde bırakılabilir (drop period)
 *       - Section kapasitesi güncellenir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Enrollment ID
 *     responses:
 *       200:
 *         description: Ders bırakıldı
 *       400:
 *         description: Bırakma süresi geçmiş veya zaten bırakılmış
 *       404:
 *         description: Kayıt bulunamadı
 *
 * /api/v1/enrollments/my-courses:
 *   get:
 *     tags: [Enrollments]
 *     summary: Kayıtlı derslerim
 *     description: Öğrencinin kayıtlı olduğu tüm dersleri listeler.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *           enum: [fall, spring, summer]
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [enrolled, completed, failed, dropped]
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
 *                     $ref: '#/components/schemas/Enrollment'
 *       401:
 *         description: Yetkilendirme hatası
 *
 * /api/v1/enrollments/students/{sectionId}:
 *   get:
 *     tags: [Enrollments]
 *     summary: Section öğrenci listesi
 *     description: Belirtilen section'a kayıtlı öğrencileri listeler. Sadece eğitmen görebilir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sectionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Başarılı
 *       403:
 *         description: Bu section'ın eğitmeni değilsiniz
 *       404:
 *         description: Section bulunamadı
 *
 * /api/v1/enrollments/schedule:
 *   get:
 *     tags: [Enrollments]
 *     summary: Haftalık ders programı
 *     description: Öğrencinin haftalık ders programını döndürür.
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
 *                     Monday:
 *                       type: array
 *                     Tuesday:
 *                       type: array
 *                     Wednesday:
 *                       type: array
 *                     Thursday:
 *                       type: array
 *                     Friday:
 *                       type: array
 */
