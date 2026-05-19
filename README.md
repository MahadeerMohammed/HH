# HotelHub Admin

HotelHub Admin is a full-stack admin-only hotel room management platform built for cross-platform use on iOS, Android, tablet, laptop, and desktop browser workflows.

## Stack

- Frontend: Ionic React + Vite + Capacitor
- Backend: Spring Boot 3 + Spring Security + JWT
- Database: PostgreSQL + Flyway migrations
- Delivery: Docker Compose for local full-stack startup

## Core Features

- Admin login with short-lived JWT access tokens and rotated HttpOnly refresh cookies
- Room inventory management with operational status and base pricing
- Revenue ledger for room stays, booking channels, taxes, and variable costs
- Expense ledger for room-linked and property-wide operating expenses
- Dashboard analytics for revenue, costs, profit, and occupancy
- Profitability reports with CSV export
- Responsive UI designed for mobile and desktop layouts from one codebase

## Project Layout

- [backend](backend)
- [frontend](frontend)
- [docs/security.md](docs/security.md)
- [docs/architecture.md](docs/architecture.md)
- [docker-compose.yml](docker-compose.yml)

## Local Run (No Docker)

1. Install and start PostgreSQL locally.
2. Create database:
   - `CREATE DATABASE hotelhub;`
3. In terminal run backend:
   - `cd backend`
   - `mvn spring-boot:run -Dspring-boot.run.profiles=local`
4. In another terminal run frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`
5. Open `http://localhost:5173`.

## Mobile Targets

- Build the web app in [frontend](frontend) with `npm install` and `npm run build`
- Add native shells with `npx cap add android` and `npx cap add ios`
- Sync assets with `npm run sync:mobile`
- Open the native projects with `npm run open:android` or `npm run open:ios`

## Security Notes

The codebase includes production-minded hardening, but no application can honestly be claimed vulnerability-free without ongoing dependency updates, secret rotation, infrastructure controls, SAST/DAST, logging, monitoring, and penetration testing. See [docs/security.md](docs/security.md) for the implemented controls and the next hardening steps.

## Important Defaults

- Change the bootstrap admin password before any real deployment
- Replace the JWT secret with a strong 32-byte Base64 value
- Set `SECURE_COOKIES=true` behind HTTPS
- Restrict `CORS_ALLOWED_ORIGINS` to your real frontend origins

## PostgreSQL / pgAdmin Connection

- Host: `localhost`
- Port: `5432`
- Username: `postgres`
- Password: `admin`
- Database: `hotelhub`

## Prisma (Schema + DB tooling)

Prisma files are added at project root:
- `prisma/schema.prisma`
- `.env.prisma.example`

Commands:
1. `npm install` (from project root)
2. `copy .env.prisma.example .env`
3. `npm run prisma:generate`
4. `npm run prisma:studio` to browse data in a UI
5. `npm run prisma:migrate -- --name <change_name>` for schema changes
