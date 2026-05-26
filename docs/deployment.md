# HotelHub Live Deployment

This app has three production parts:

1. PostgreSQL database
2. Spring Boot backend API
3. Ionic React frontend / Android APK

The APK and website do not store the live database. They connect to the live backend API, and the backend connects to PostgreSQL.

## Recommended URLs

Use real HTTPS URLs before sharing the app:

```text
Frontend website: https://hotelhub.example.com
Backend API:      https://api.hotelhub.example.com
Database:         private PostgreSQL server, not public
```

Replace `example.com` everywhere with your real domain.

## Production Environment

Create a production env file on the server from this shape:

```env
POSTGRES_DB=hotelhub
POSTGRES_USER=hotelhub
POSTGRES_PASSWORD=change-this-database-password

DB_URL=jdbc:postgresql://postgres:5432/hotelhub
DB_USERNAME=hotelhub
DB_PASSWORD=change-this-database-password

JWT_SECRET=generate-a-32-byte-base64-secret-before-deploying
ACCESS_TOKEN_MINUTES=15
REFRESH_TOKEN_DAYS=14
JWT_ISSUER=hotelhub-admin

SECURE_COOKIES=true
COOKIE_SAME_SITE=None
CORS_ALLOWED_ORIGINS=https://hotelhub.example.com,capacitor://localhost,http://localhost

BOOTSTRAP_ADMIN_EMAIL=admin@example.com
BOOTSTRAP_ADMIN_PASSWORD=change-this-admin-password
BOOTSTRAP_ADMIN_FULL_NAME=Hotel Admin
BOOTSTRAP_SAMPLE_DATA=false

VITE_API_BASE_URL=https://api.hotelhub.example.com
```

Generate a JWT secret with:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

## Deploy With Docker Compose

On the live server:

```bash
git clone <your-repo-url> hotelhub
cd hotelhub
cp .env.prod.example .env.prod
nano .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d --build
```

Check containers:

```bash
docker compose --env-file .env.prod -f docker-compose.prod.yml ps
docker compose --env-file .env.prod -f docker-compose.prod.yml logs -f backend
```

Flyway runs database migrations automatically when the backend starts.

## Build Android APK

Set the mobile API URL in `frontend/.env.mobile`:

```env
VITE_API_BASE_URL=https://api.hotelhub.example.com
```

Then build and sync:

```powershell
cd frontend
npm run build:mobile
npm run sync:mobile
cd android
.\gradlew assembleDebug
```

Debug APK output:

```text
frontend/android/app/build/outputs/apk/debug/app-debug.apk
```

For real users, create a signed release APK from Android Studio:

1. Open `frontend/android` in Android Studio.
2. Select `Build > Generate Signed Bundle / APK`.
3. Choose `APK`.
4. Create or select a keystore.
5. Build `release`.

Release APK output is usually:

```text
frontend/android/app/release/app-release.apk
```

## Publish APK Download

After creating a signed release APK:

1. Upload it to your website, for example `/downloads/hotelhub-admin.apk`.
2. Add a download button on the frontend.
3. Keep the APK version updated when you change the mobile app.

Direct APK download is fine for private/internal use. For public users, Google Play Store is better because updates, trust, and install flow are cleaner.
