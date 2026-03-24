.PHONY: dev dev-backend dev-frontend test test-frontend test-backend lint docker docker-up docker-down clean install

# ─── Development ───────────────────────────────────────────────
install:
	npm install
	cd backend && python -m venv .venv && . .venv/bin/activate && pip install -r requirements.txt

dev: dev-backend dev-frontend

dev-frontend:
	npm run dev

dev-backend:
	cd backend && . .venv/bin/activate && uvicorn app.main:app --reload --port 8000

# ─── Testing ───────────────────────────────────────────────────
test: test-frontend test-backend

test-frontend:
	npx vitest run

test-backend:
	cd backend && . .venv/bin/activate && python -m pytest tests/ -v

# ─── Linting ───────────────────────────────────────────────────
lint:
	cd backend && . .venv/bin/activate && ruff check .

lint-fix:
	cd backend && . .venv/bin/activate && ruff check --fix .

# ─── Docker ────────────────────────────────────────────────────
docker:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

# ─── Cleanup ───────────────────────────────────────────────────
clean:
	rm -rf node_modules dist backend/.venv backend/data backend/__pycache__
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
