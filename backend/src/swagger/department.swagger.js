/**
 * @swagger
 * /api/v1/departments:
 *   get:
 *     summary: Bölüm listesi
 *     description: |
 *       Sistemdeki tüm bölümleri listeler.
 *       Bu endpoint herkese açıktır (authentication gerektirmez).
 *       Kayıt formunda bölüm seçimi için kullanılabilir.
 *     tags: [Departments]
 *     responses:
 *       200:
 *         description: Bölüm listesi başarıyla alındı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Department'
 *             example:
 *               success: true
 *               data:
 *                 - id: "123e4567-e89b-12d3-a456-426614174000"
 *                   name: "Bilgisayar Mühendisliği"
 *                   code: "BLM"
 *                   faculty: "Mühendislik Fakültesi"
 *                 - id: "456e7890-e89b-12d3-a456-426614174001"
 *                   name: "Elektrik-Elektronik Mühendisliği"
 *                   code: "EEM"
 *                   faculty: "Mühendislik Fakültesi"
 *                 - id: "789e0123-e89b-12d3-a456-426614174002"
 *                   name: "Makine Mühendisliği"
 *                   code: "MAK"
 *                   faculty: "Mühendislik Fakültesi"
 *                 - id: "abc12345-e89b-12d3-a456-426614174003"
 *                   name: "İşletme"
 *                   code: "ISL"
 *                   faculty: "İktisadi ve İdari Bilimler Fakültesi"
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               error:
 *                 code: "INTERNAL_ERROR"
 *                 message: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
 */

module.exports = {};
