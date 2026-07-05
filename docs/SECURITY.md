# Security Protocols

## Current Status (Post-Audit)

- CSP headers enabled at Traefik and Node.js proxy layers
- CORS configured with strict allowlist (no wildcard fallback)
- Traefik BasicAuth for management dashboard
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, etc.) enforced
- `/__health` and `/__config` endpoints protected by admin token
- Secrets managed via `.env` files (not committed) — pending migration to Docker Secrets

## Warnings

- API keys exist in plaintext `.env` files on disk — rotate all keys immediately
- No automated secret scanning in CI — recommended: gitleaks or trufflehog
- OWASP dependency scanning not configured
