# ============================================
# ENV File Strategy for HotelHub Project
# ============================================

## Branch Strategy

### main branch (Local Development)
- **Purpose**: Development branch with local database
- **Files**:
  - `.env.example` - Template for local development (COMMITTED)
  - `.env` - Your local development env (NOT committed - in .gitignore)
  - `.env.prisma.example` - Prisma template (COMMITTED)
  
- **Setup**:
  ```bash
  cp .env.example .env
  # Edit .env with your local database credentials
  ```

### prod branch (Production Deployment)
- **Purpose**: Production environment for live servers
- **Files**:
  - `.env.example` - Local template (COMMITTED)
  - `.env.render.example` - Render template (COMMITTED)
  - `.env.render` - Actual production env (NOT committed - in .gitignore)
  
- **Setup**:
  ```bash
  cp .env.render.example .env.render
  # Edit .env.render with your ACTUAL production credentials
  ```

## Key Rules

✅ **DO** commit:
- `*.example` files (templates)
- `.gitignore`
- `ENV.md` (this file)

❌ **DON'T** commit:
- `.env` files (all variants)
- `node_modules/`, `dist/`, `build/`, etc.
- Any files containing credentials or secrets

## Switching Between Branches

```bash
# Switch to main (local development)
git checkout main

# Switch to prod (production deployment)
git checkout prod

# Push both branches
git push origin main
git push origin prod
```

## Environment Variables Management

### Local Development (.env in main)
```
DATABASE_URL="postgresql://localhost:5432/HHManagement"
VITE_API_BASE_URL=http://localhost:8080
```

### Production (/.env.render in prod)
```
DB_URL=jdbc:postgresql://[RENDER_HOST]:5432/hotelhub_xgsz
VITE_API_BASE_URL=https://api.hotelhub.example.com
```

## Important Notes

1. **Never commit .env files** - They contain secrets!
2. **Each developer** gets their own local `.env` from `.env.example`
3. **Production .env.render** stays on prod branch only
4. **No conflicts** - Different branches, different env files
5. **Always update examples** - If you add new env vars, update the `.example` files

## Deployment Flow

1. Develop on `main` with local `.env`
2. Push to `origin main` (`.env` ignored)
3. Create/update `.env.render` on `prod` branch
4. Deploy using `prod` branch env vars
