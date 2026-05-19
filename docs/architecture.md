# Architecture

## Frontend

The client uses Ionic React so one UI codebase can serve:

- Web and desktop browsers directly
- Android via Capacitor
- iOS via Capacitor

The layout is responsive rather than mobile-only, so dashboard-heavy admin workflows still feel usable on laptops and larger displays.

## Backend

The API uses Spring Boot 3 because it is durable, well-supported, and well-suited for long-term enterprise maintenance. The backend exposes:

- `/api/v1/auth` for login, refresh, logout, and current-user lookup
- `/api/v1/rooms` for room inventory management
- `/api/v1/revenue` for revenue ledger management
- `/api/v1/expenses` for expense ledger management
- `/api/v1/dashboard` for summary metrics
- `/api/v1/reports` for reporting and CSV export

## Database

PostgreSQL stores the operational data and Flyway owns schema migrations. The schema includes:

- `admin_users`
- `rooms`
- `revenue_entries`
- `expenses`
- `refresh_tokens`

## Session Model

- Login returns a short-lived JWT access token for API authorization
- Refresh tokens are rotated and stored server-side as SHA-256 hashes
- The refresh token is delivered as an HttpOnly cookie
- The frontend only keeps the access token in memory

## Reporting Model

The system calculates:

- Gross revenue
- Revenue-side costs such as channel fees, tax, and variable cost
- Operating expenses
- Net profit
- Room-level profitability
- Occupancy rate using active and occupied room counts
