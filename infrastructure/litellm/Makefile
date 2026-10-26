.PHONY: help setup start stop restart logs health test clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

setup: ## Run setup script (generate .env from vault)
	@./setup.sh

start: ## Start LiteLLM proxy
	@docker compose up -d

stop: ## Stop LiteLLM proxy
	@docker compose down

restart: ## Restart LiteLLM proxy
	@docker compose restart

logs: ## Show proxy logs
	@docker logs litellm-proxy -f

health: ## Run health check
	@./verify.sh

test: ## Test completion with default model
	@API_KEY=$$(grep LITELLM_API_KEY .env | cut -d= -f2); \
	curl -s http://localhost:4000/v1/chat/completions \
		-H "Authorization: Bearer $$API_KEY" \
		-H "Content-Type: application/json" \
		-d '{"model":"openai/gpt-4o-mini","messages":[{"role":"user","content":"ping"}],"max_tokens":1}' | jq .

models: ## List available models
	@API_KEY=$$(grep LITELLM_API_KEY .env | cut -d= -f2); \
	curl -s http://localhost:4000/v1/models \
		-H "Authorization: Bearer $$API_KEY" | jq '.data[].id'

clean: ## Remove proxy container and volumes
	@docker compose down -v

migrate: ## Migrate existing apps to use LiteLLM
	@./migrate-apps.sh
