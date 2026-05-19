# Security

## Implemented Controls

- Spring Security protects every non-auth API route with admin-only authorization
- Passwords are stored with BCrypt cost 12
- Access tokens are short-lived JWTs
- Refresh tokens are random, rotated, server-tracked, and stored as SHA-256 hashes
- Refresh tokens are sent through HttpOnly cookies
- The frontend keeps access tokens in memory instead of local storage
- CORS is configurable and credential-aware
- Validation is enforced on DTOs at the API boundary
- Global exception handling avoids raw stack traces reaching clients
- Common browser security headers are enabled
- Login attempts are rate-limited in memory to slow brute-force attacks
- The database schema is migration-controlled with Flyway

## Honest Caveat

No serious engineer should promise that software is free of vulnerabilities. What this project does provide is a hardened baseline. To move from strong baseline to production-grade assurance, you should still add:

- Dependency scanning in CI
- Static analysis
- Container image scanning
- Secrets management instead of plain env files
- HTTPS termination and secure cookie enforcement
- Audit logs and alerting
- Backup and restore automation
- Regular penetration testing
- Centralized rate limiting for multi-instance deployments, usually with Redis or an API gateway

## Production Hardening Checklist

- Replace all bootstrap credentials
- Replace the JWT secret with a strong Base64-encoded 32-byte secret
- Restrict frontend origins to the real deployed app domains
- Set `SECURE_COOKIES=true`
- Run behind HTTPS only
- Put the backend behind a reverse proxy or gateway
- Add request logging with sensitive-field redaction
- Add database backups and restore drills
- Review database least-privilege permissions
- Add MFA or an IdP for admin authentication if the business requires stronger assurance
