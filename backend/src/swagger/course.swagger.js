/**
 * @swagger
 * /api/v1/courses:
 *   get:
 *     tags: [Courses]
 *     summary: Ders listesi
 *     description: Tüm dersleri listeler. Pagination, filtreleme ve arama destekler.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Sayfa başına kayıt sayısı
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Ders kodu veya adında arama
 *       - in: query
 *         name: department_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bölüm ID'sine göre filtrele
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
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Course'
 *                     pagination:
 *                       type: object
 *
 *   post:
 *     tags: [Courses]
 *     summary: Yeni ders oluştur
 *     description: Yeni bir ders oluşturur. Sadece admin kullanabilir.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name, credits, ects, department_id]
 *             properties:
 *               code:
 *                 type: string
 *                 example: CSE101
 *               name:
 *                 type: string
 *                 example: Introduction to Computer Science
 *               description:
 *                 type: string
 *               credits:
 *                 type: integer
 *                 example: 3
 *               ects:
 *                 type: integer
 *                 example: 5
 *               department_id:
 *                 type: string
 *                 format: uuid
 *               prerequisite_ids:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Ders oluşturuldu
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Yetki yetersiz
 *
 * /api/v1/courses/{id}:
 *   get:
 *     tags: [Courses]
 *     summary: Ders detayları
 *     description: Belirtilen dersin detaylarını getirir. Önkoşullar dahil.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Ders ID
 *     responses:
 *       200:
 *         description: Başarılı
 *       404:
 *         description: Ders bulunamadı
 *
 *   put:
 *     tags: [Courses]
 *     summary: Ders güncelle
 *     description: Dersi günceller. Sadece admin kullanabilir.
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               credits:
 *                 type: integer
 *               ects:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Güncellendi
 *       404:
 *         description: Ders bulunamadı
 *
 *   delete:
 *     tags: [Courses]
 *     summary: Ders sil (soft delete)
 *     description: Dersi silinmiş olarak işaretler. Sadece admin kullanabilir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Silindi
 *       404:
 *         description: Ders bulunamadı
 *
 * /api/v1/courses/{id}/prerequisites:
 *   get:
 *     tags: [Courses]
 *     summary: Önkoşul ağacı
 *     description: Dersin tüm önkoşullarını recursive olarak getirir.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Önkoşul listesi
 */
