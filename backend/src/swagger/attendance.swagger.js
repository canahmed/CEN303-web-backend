/**
 * @swagger
 * /api/v1/attendance/sessions:
 *   post:
 *     tags: [Attendance]
 *     summary: Yoklama oturumu aç
 *     description: |
 *       Yeni bir yoklama oturumu açar. Sadece eğitmen kullanabilir.
 *       - Derslik GPS koordinatları otomatik alınır
 *       - QR kod oluşturulur (30 dk geçerli)
 *       - Geofence radius varsayılan 15m
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
 *               geofence_radius:
 *                 type: integer
 *                 default: 15
 *                 description: Geofence yarıçapı (metre)
 *               latitude:
 *                 type: number
 *                 description: Manuel GPS koordinatı (opsiyonel)
 *               longitude:
 *                 type: number
 *     responses:
 *       201:
 *         description: Oturum açıldı
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
 *                     id:
 *                       type: string
 *                     qr_code:
 *                       type: string
 *                     qr_expires_at:
 *                       type: string
 *                       format: date-time
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     geofence_radius:
 *                       type: integer
 *       403:
 *         description: Bu dersin eğitmeni değilsiniz
 *       409:
 *         description: Zaten aktif oturum var
 *
 * /api/v1/attendance/sessions/{id}:
 *   get:
 *     tags: [Attendance]
 *     summary: Oturum detayları
 *     description: Yoklama oturumunun detaylarını getirir.
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
 *         description: Başarılı
 *       404:
 *         description: Oturum bulunamadı
 *
 * /api/v1/attendance/sessions/{id}/close:
 *   put:
 *     tags: [Attendance]
 *     summary: Oturumu kapat
 *     description: Yoklama oturumunu kapatır.
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
 *         description: Oturum kapatıldı
 *       400:
 *         description: Oturum zaten kapalı
 *       403:
 *         description: Bu oturumun sahibi değilsiniz
 *
 * /api/v1/attendance/sessions/{id}/checkin:
 *   post:
 *     tags: [Attendance]
 *     summary: Yoklama ver
 *     description: |
 *       Öğrenci yoklama verir. GPS koordinatları ile mesafe doğrulanır.
 *       - Haversine formula ile mesafe hesaplanır
 *       - GPS spoofing tespiti yapılır
 *       - Şüpheli aktiviteler işaretlenir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Session ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [latitude, longitude]
 *             properties:
 *               latitude:
 *                 type: number
 *                 example: 41.0082
 *               longitude:
 *                 type: number
 *                 example: 28.9784
 *               accuracy:
 *                 type: number
 *                 description: GPS doğruluk (metre)
 *                 example: 5
 *               qr_code:
 *                 type: string
 *                 description: QR kod (opsiyonel backup)
 *     responses:
 *       200:
 *         description: Yoklama verildi
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
 *                   type: object
 *                   properties:
 *                     distance_from_center:
 *                       type: number
 *                       description: Sınıftan uzaklık (metre)
 *                     is_flagged:
 *                       type: boolean
 *                       description: Şüpheli mi?
 *       400:
 *         description: Oturum kapalı veya süresi dolmuş
 *       403:
 *         description: Bu derse kayıtlı değilsiniz
 *       409:
 *         description: Zaten yoklama verildi
 *
 * /api/v1/attendance/sessions/my-sessions:
 *   get:
 *     tags: [Attendance]
 *     summary: Oturumlarım (Faculty)
 *     description: Eğitmenin açtığı yoklama oturumlarını listeler.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Başarılı
 *
 * /api/v1/attendance/my-attendance:
 *   get:
 *     tags: [Attendance]
 *     summary: Devam durumum (Student)
 *     description: |
 *       Öğrencinin tüm derslerindeki devam durumunu getirir.
 *       - Toplam oturum sayısı
 *       - Katılım yüzdesi
 *       - Uyarı durumu (>20% devamsızlık warning, >30% critical)
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
 *                       courseCode:
 *                         type: string
 *                       courseName:
 *                         type: string
 *                       totalSessions:
 *                         type: integer
 *                       attendedSessions:
 *                         type: integer
 *                       attendanceRate:
 *                         type: number
 *                       status:
 *                         type: string
 *                         enum: [ok, warning, critical]
 *
 * /api/v1/attendance/report/{sectionId}:
 *   get:
 *     tags: [Attendance]
 *     summary: Yoklama raporu (Faculty)
 *     description: Section için detaylı yoklama raporu.
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
 *
 * /api/v1/attendance/excuse-requests:
 *   post:
 *     tags: [Attendance]
 *     summary: Mazeret bildir
 *     description: Yoklama için mazeret bildirimi yapar.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [session_id, reason]
 *             properties:
 *               session_id:
 *                 type: string
 *                 format: uuid
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 description: Mazeret açıklaması
 *               document:
 *                 type: string
 *                 format: binary
 *                 description: Belge (rapor vb.)
 *     responses:
 *       201:
 *         description: Mazeret bildirimi alındı
 *
 *   get:
 *     tags: [Attendance]
 *     summary: Mazeret listesi (Faculty)
 *     description: Eğitmenin dersleri için gelen mazeret taleplerini listeler.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *     responses:
 *       200:
 *         description: Başarılı
 *
 * /api/v1/attendance/excuse-requests/{id}/approve:
 *   put:
 *     tags: [Attendance]
 *     summary: Mazereti onayla
 *     description: Mazeret talebini onaylar.
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
 *         description: Onaylandı
 *
 * /api/v1/attendance/excuse-requests/{id}/reject:
 *   put:
 *     tags: [Attendance]
 *     summary: Mazereti reddet
 *     description: Mazeret talebini reddeder.
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notes:
 *                 type: string
 *                 description: Red gerekçesi
 *     responses:
 *       200:
 *         description: Reddedildi
 */
