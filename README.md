# Loomy

Teknik servis firmaları için yönetim paneli: müşteriler, servis formları, teklifler,
stok, ekip/randevu planlama ve finans takibi.

## Proje yapısı

| Klasör | İçerik | Teknoloji |
|---|---|---|
| `backend/` | REST API (`/api/...`) | Express, Prisma, PostgreSQL |
| `frontend/` | Uygulama (web/PWA + mobil) | Expo, React Native, expo-router, NativeWind |
| `web/` | Tanıtım sitesi ve başvuru formu | Vite, React |
| `docs/` | KVKK uyum notları | — |

Backend katmanları: `routes → controllers → services/utils`. Her istek
`authenticate` ile şirkete (`companyId`) bağlanır; controller'lar tüm sorgularda
`companyId` filtresi kullanır.

## Geliştirme ortamı

Gerekenler: Node.js 20+, Docker (PostgreSQL için).

```bash
# 1) Veritabanı
docker compose up -d postgres        # localhost:5433

# 2) Backend
cd backend
cp .env.example .env                 # değerleri doldur (aşağıya bak)
npm install
npx prisma migrate dev
npm run dev                          # http://localhost:8080/api

# 3) Uygulama
cd ../frontend
npm install
npm run web                          # veya: npm run android / npm run ios

# 4) Tanıtım sitesi (opsiyonel)
cd ../web && npm install && npm run dev
```

## Backend ortam değişkenleri

| Değişken | Zorunlu | Açıklama |
|---|---|---|
| `DATABASE_URL` | ✓ | PostgreSQL bağlantısı, örn. `postgresql://postgres:postgres@localhost:5433/management_dashboard?schema=public` |
| `JWT_SECRET` | ✓ | Token imzalama anahtarı. Yoksa sunucu başlamaz. |
| `PORT` | | Varsayılan `8080` |
| `ALLOWED_ORIGINS` | | Virgülle ayrılmış CORS listesi; `*` joker desteklenir (`https://*.vercel.app`). Boşsa koddaki varsayılan liste kullanılır. |
| `TRUST_PROXY_HOPS` | | Önündeki reverse proxy sayısı (varsayılan `1`). Rate limit için gerçek istemci IP'si buna göre hesaplanır. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | ✓* | Doğrulama/şifre sıfırlama mailleri. |
| `SENDGRID_API_KEY`, `SENDGRID_FROM` | ✓* | SMTP yerine SendGrid kullanılacaksa. |
| `APPLICATION_EMAIL` | | Web sitesindeki başvuruların gönderileceği adres. |
| `APPLY_MAX_PER_HOUR` | | IP başına saatlik başvuru limiti. |
| `DEV_EMAIL`, `DEV_PASSWORD` | | Geliştirici paneli (`/dev`) girişi. Boşsa panel kapalıdır. |

\* SMTP veya SendGrid'den biri gereklidir.

Frontend: `EXPO_PUBLIC_API_URL` (örn. `https://.../api`). Web sitesi: `VITE_API_URL`.

## Testler

```bash
cd backend
npm test             # jest; veritabanı gerektirmez (Prisma mock'lanır)
npx tsc --noEmit     # tip kontrolü
```

## Deploy

- **Backend:** kökteki `dockerfile` ile build edilir; `npm start` açılışta
  `prisma migrate deploy` çalıştırır. Yeni migration'lar deploy anında canlı
  veritabanına uygulanır — veri dönüştüren migration'ları önce yedekle.
- **Frontend / web:** Vercel (`vercel.json`).
- **Yedekleme:** `backend/docker-compose.yml` içindeki `backup` servisi ve
  `backend/scripts/backup.sh` / `restore.sh`.
