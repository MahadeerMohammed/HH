# ============================================
# Deployment Configuration Guide
# ============================================

## Netlify (Frontend Deployment)

### Update Branch for Production
1. Go to **netlify.com** → Your Site → **Build & Deploy** → **Build settings**
2. Find **"Deploy Contexts"** section
3. Update the settings:
   - **Production branch**: Change from `main` to `prod`
   - **Deploy previews**: Leave as `main` (for development PRs)
   - **Branch deploys**: (Optional) Add any other branches

### Netlify Configuration
The `netlify.toml` file is already configured:
```toml
[build]
  command = "cd frontend && npm install && npm run build"
  publish = "frontend/dist"
```

**Current Setup:**
- ✅ Builds from: `frontend/` directory
- ✅ Publishes: `frontend/dist/`
- ✅ Uses env: `.env.render` (from `prod` branch)

---

## Render (Backend Deployment)

### Update Branch for Production
1. Go to **render.com** → Your Service → **Settings**
2. Find **"Deploy"** section
3. Update:
   - **Branch**: Change from `main` to `prod`
   - **Auto-deploy**: Enable/disable as needed
   - **Build command**: Ensure it's using Maven build

### Render Environment Variables
1. Go to **Settings** → **Environment**
2. Add/Update:
   ```
   DB_URL=jdbc:postgresql://[your-render-postgres]:5432/hotelhub_xgsz
   DB_USERNAME=hotelhub
   DB_PASSWORD=[your-password]
   JWT_SECRET=[your-jwt-secret]
   SPRING_JPA_HIBERNATE_DDL_AUTO=none
   SPRING_FLYWAY_ENABLED=true
   CORS_ALLOWED_ORIGINS=https://your-domain.com,capacitor://localhost
   BOOTSTRAP_ADMIN_EMAIL=admin@example.com
   BOOTSTRAP_ADMIN_PASSWORD=[your-password]
   ```

### Render Dockerfile
The `backend/Dockerfile` is already optimized:
- ✅ Builds Java/Maven application
- ✅ Uses environment variables
- ✅ Production-ready setup

---

## Deployment Flow

### Development → Main Branch
```
main branch (localhost:5432)
    ↓
Local Development & Testing
    ↓
Commit & Push to GitHub
```

### Production → Prod Branch
```
prod branch (.env.render - actual prod secrets)
    ↓
Netlify deploys frontend (prod branch)
    ↓
Render deploys backend (prod branch)
    ↓
✓ Live at: hotelhub.example.com
```

---

## Checklist

Before deploying to production:

### Netlify Frontend
- [ ] Change production branch from `main` to `prod`
- [ ] Verify `VITE_API_BASE_URL=https://api.hotelhub.example.com` in `.env.render`
- [ ] Test build locally: `cd frontend && npm run build`

### Render Backend
- [ ] Change branch from `main` to `prod`
- [ ] Add all environment variables from `.env.render.example`
- [ ] Update actual database credentials (not examples!)
- [ ] Test deployment after branch change

### Both Platforms
- [ ] Enable auto-deploy (if desired)
- [ ] Set up monitoring/alerts
- [ ] Test API endpoints after deployment

---

## Troubleshooting

### Build Fails After Branch Change
- [ ] Verify `.env.render` exists in `prod` branch
- [ ] Check environment variables are set in platform
- [ ] View build logs in Netlify/Render dashboard

### API Connection Issues
- [ ] Verify `VITE_API_BASE_URL` points to correct backend
- [ ] Check `CORS_ALLOWED_ORIGINS` includes frontend domain
- [ ] Verify database connection string is correct

### APK Versioning
For production, merge to `prod` and let GitHub Actions build the signed APK.

The workflow:
1. Builds the mobile frontend
2. Generates/syncs the Capacitor Android project
3. Builds a signed release APK
4. Replaces `frontend/public/downloads/hotelhub-admin.apk`
5. Updates `frontend/public/version.json`
6. Commits those generated files back to `prod`

The download page reads `frontend/public/version.json` and downloads `/downloads/hotelhub-admin.apk`.

### APK CI Secrets
The GitHub Actions APK workflow needs these repository secrets:
- `ANDROID_RELEASE_KEYSTORE_BASE64`
- `ANDROID_RELEASE_KEYSTORE_PASSWORD`
- `ANDROID_RELEASE_KEY_ALIAS`
- `ANDROID_RELEASE_KEY_PASSWORD`

Current local signing values:
- Alias: `hotelhub`
- Store password: `cB6DX83mCbkLpnZb5KLG3EA9`
- Key password: `cB6DX83mCbkLpnZb5KLG3EA9`

Create `ANDROID_RELEASE_KEYSTORE_BASE64` from `frontend/android/release-keystore.jks`.

### Keep-Alive Ping
If you want to reduce cold starts on an idle Render service, use a single lightweight health ping on a schedule.

Recommended setup:
- Endpoint: `GET /api/v1/health/ping`
- Response: `204 No Content`
- Frequency: every 10 minutes
- Behavior: one request only, no retries, no parallel runs

The repo includes a GitHub Actions workflow at [`.github/workflows/render-keepalive.yml`](./.github/workflows/render-keepalive.yml).

Before enabling it:
1. Add a GitHub secret named `RENDER_KEEPALIVE_URL`
2. Set it to your Render URL plus `/api/v1/health/ping`
3. Keep the interval at or above 10 minutes to avoid unnecessary traffic

Example:
```text
https://your-service.onrender.com/api/v1/health/ping
```

This is intentionally minimal so the request stays clear and the load stays low.

### Git Branch Not Showing
- [ ] Push `prod` branch: `git push origin prod`
- [ ] Refresh Netlify/Render settings page
- [ ] May take 5-10 seconds to appear

---

## Important Notes

⚠️ **After switching to `prod` branch:**
- Never commit `.env.render` (it's in .gitignore)
- All secrets stay local to `prod` branch
- Main branch remains safe for local development
- No conflicts between dev and prod environments
