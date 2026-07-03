.PHONY: up down build logs dev clean db-migrate db-reset

# ── Docker Commands ──────────────────────────────────────
up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build --no-cache

logs:
	docker compose logs -f

# ── Development ──────────────────────────────────────────
dev:
	docker compose -f docker-compose.yml -f docker-compose.dev.yml up

# ── Database ─────────────────────────────────────────────
db-migrate:
	cd server && alembic upgrade head

db-reset:
	docker compose down -v
	docker compose up -d postgres redis minio
	sleep 5
	cd server && alembic upgrade head

# ── Cleanup ──────────────────────────────────────────────
clean:
	docker compose down -v --remove-orphans
	rm -rf client/.next client/node_modules
	rm -rf server/__pycache__ server/.pytest_cache
