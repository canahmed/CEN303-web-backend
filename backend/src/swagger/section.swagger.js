/**
 * @swagger
 * /api/v1/sections:
 *   get:
 *     tags: [Sections]
 *     summary: Section listesi
 *     description: Ders şubelerini listeler. Dönem ve yıl ile filtrelenebilir.
 *     parameters:
 *       - in: query
 *         name: semester
 *         schema:
 *           type: string
 *           enum: [fall, spring, summer]
 *         description: Dönem (fall, spring, summer)
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *         description: Akademik yıl
 *       - in: query
 *         name: course_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ders ID'sine göre filtrele
 *       - in: query
 *         name: instructor_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Eğitmen ID'sine göre filtrele
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
 *                     sections:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Section'
 *
 *   post:
 *     tags: [Sections]
 *     summary: Yeni section oluştur
 *     description: Yeni bir ders şubesi oluşturur. Sadece admin kullanabilir.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [course_id, section_number, semester, year, instructor_id, capacity]
 *             properties:
 *               course_id:
 *                 type: string
 *                 format: uuid
 *               section_number:
 *                 type: integer
 *                 example: 1
 *               semester:
 *                 type: string
 *                 enum: [fall, spring, summer]
 *               year:
 *                 type: integer
 *                 example: 2024
 *               instructor_id:
 *                 type: string
 *                 format: uuid
 *               capacity:
 *                 type: integer
 *                 example: 40
 *               classroom_id:
 *                 type: string
 *                 format: uuid
 *               schedule:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     day:
 *                       type: string
 *                       enum: [Monday, Tuesday, Wednesday, Thursday, Friday]
 *                     start_time:
 *                       type: string
 *                       example: "09:00"
 *                     end_time:
 *                       type: string
 *                       example: "10:30"
 *     responses:
 *       201:
 *         description: Section oluşturuldu
 *       401:
 *         description: Yetkilendirme hatası
 *
 * /api/v1/sections/{id}:
 *   get:
 *     tags: [Sections]
 *     summary: Section detayları
 *     description: Belirtilen section'ın detaylarını getirir.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Başarılı
 *       404:
 *         description: Section bulunamadı
 *
 *   put:
 *     tags: [Sections]
 *     summary: Section güncelle
 *     description: Section bilgilerini günceller. Sadece admin kullanabilir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               capacity:
 *                 type: integer
 *               instructor_id:
 *                 type: string
 *                 format: uuid
 *               classroom_id:
 *                 type: string
 *                 format: uuid
 *               schedule:
 *                 type: array
 *     responses:
 *       200:
 *         description: Güncellendi
 *       404:
 *         description: Section bulunamadı
 */
