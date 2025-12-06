# Smart Campus Backend API

Akıllı Kampüs Ekosistem Yönetim Platformu - Backend API

## 🚀 Teknoloji Stack

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** PostgreSQL 14+
- **ORM:** Sequelize
- **Authentication:** JWT (jsonwebtoken)
- **Password Hashing:** bcrypt (10 salt rounds)
- **Validation:** Joi
- **File Upload:** Multer
- **Email:** NodeMailer

## 📁 Proje Yapısı

```
backend/
├── src/
│   ├── config/          # Konfigürasyon dosyaları
│   ├── controllers/     # Route handler'ları
│   ├── middleware/      # Express middleware'leri
│   ├── models/          # Sequelize modelleri
│   ├── routes/          # API route tanımları
│   ├── services/        # İş mantığı katmanı
│   ├── utils/           # Yardımcı fonksiyonlar
│   ├── validations/     # Joi şemaları
│   └── app.js           # Ana uygulama
├── tests/               # Test dosyaları
├── migrations/          # Veritabanı migration'ları
├── seeders/             # Test verileri
├── uploads/             # Yüklenen dosyalar
├── docker-compose.yml   # Docker konfigürasyonu
└── Dockerfile
```

## 🛠️ Kurulum

### Gereksinimler

- Node.js 18+
- PostgreSQL 14+
- npm veya yarn

### 1. Bağımlılıkları Yükle

```bash
cd backend
npm install
```

### 2. Ortam Değişkenlerini Ayarla

```bash
cp .env.example .env
# .env dosyasını düzenle
```

### 3. Veritabanını Oluştur

PostgreSQL'de `campus_db` veritabanını oluşturun:

```sql
CREATE DATABASE campus_db;
```

### 4. Seed Data Yükle

```bash
npm run seed
```

### 5. Sunucuyu Başlat

```bash
# Development
npm run dev

# Production
npm start
```

## 🐳 Docker ile Çalıştırma

```bash
# Tüm servisleri başlat
docker-compose up -d

# Logları görüntüle
docker-compose logs -f backend
```

## 📡 API Endpoints

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | `/register` | Kullanıcı kaydı |
| POST | `/verify-email` | Email doğrulama |
| POST | `/login` | Kullanıcı girişi |
| POST | `/refresh` | Token yenileme |
| POST | `/logout` | Çıkış yapma |
| POST | `/forgot-password` | Şifre sıfırlama isteği |
| POST | `/reset-password` | Şifre sıfırlama |

### Users (`/api/v1/users`)

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/me` | Profil görüntüleme |
| PUT | `/me` | Profil güncelleme |
| POST | `/me/profile-picture` | Profil fotoğrafı yükleme |
| PUT | `/me/password` | Şifre değiştirme |
| GET | `/` | Kullanıcı listesi (admin) |
| GET | `/:id` | Kullanıcı detayı (admin) |

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm test

# Unit testler
npm run test:unit

# Integration testler
npm run test:integration
```

## 📋 Test Kullanıcıları

| Rol | Email | Şifre |
|-----|-------|-------|
| Admin | admin@smartcampus.com | Admin123! |
| Faculty | mehmet.sevri@smartcampus.com | Faculty123! |
| Student | can.ahmed@smartcampus.com | Student123! |

## 👥 Ekip

Smart Campus Development Team

## 📄 Lisans

MIT License
