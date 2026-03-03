# Trading System Makefile
# Easy commands for data scraping, backtesting, and system management

.PHONY: help build up up-build start stop down logs clean
.PHONY: dev-up dev-down dev-logs dev-restart
.PHONY: scrape
.PHONY: backtest
.PHONY: list-strategies strategy-info
.PHONY: test-system status docs

# Default symbol and parameters (accept lowercase, convert to uppercase)
symbol ?= btcusdt
SYMBOL = $(shell echo $(symbol) | tr '[:lower:]' '[:upper:]')
timeframe ?= 1h
TIMEFRAME = $(timeframe)
timeframes ?= 1h
TIMEFRAMES = $(timeframes)
exchange ?= bybit
EXCHANGE = $(exchange)
start_date ?= 2024-12-01
START_DATE = $(start_date)
end_date ?= 2025-01-01
END_DATE = $(end_date)
cash ?= 1000000
CASH = $(cash)
strategy ?= simple_ma_cross
STRATEGY = $(strategy)
params ?= {}
PARAMS = $(params)
save ?= false
SAVE = $(save)
api_url ?= http://localhost:8000
API_URL = $(api_url)

# Colors for output
CYAN = \033[36m
GREEN = \033[32m
YELLOW = \033[33m
RED = \033[31m
RESET = \033[0m

help: ## Show this help message
	@echo "$(CYAN)🚀 Trading System Commands$(RESET)"
	@echo ""
	@echo "$(YELLOW)📊 Data Management:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*📊.*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)🧪 Backtesting:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*🧪.*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)🔧 System Management:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*🔧.*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)📚 Information:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*📚.*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)🎯 Quick Examples:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*🎯.*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-25s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(CYAN)Variables you can override (lowercase or uppercase):$(RESET)"
	@echo "  symbol=$(symbol) → $(SYMBOL)     timeframe=$(timeframe)     exchange=$(exchange)"
	@echo "  cash=$(cash)       strategy=$(strategy)     start_date=$(start_date)"
	@echo "  api_url=$(api_url)"
	@echo ""
	@echo "$(CYAN)Examples:$(RESET)"
	@echo "  make scrape symbol=ethusdt timeframe=4h"
	@echo "  make backtest symbol=solusdt"
	@echo "  make backtest symbol=btcusdt save=true"
	@echo "  make backtest symbol=ethusdt params='{\"fast_ma\": 5, \"slow_ma\": 20}'"
	@echo "  make up api_url=http://localhost:8000"
	@echo "  make up-build api_url=http://192.168.1.100:8000"

# =============================================================================
# 🔧 System Management
# =============================================================================

build: ## 🔧 Build Docker containers
	@echo "$(CYAN)🔨 Building Docker containers...$(RESET)"
	@docker compose build

up: ## 🔧 Start the application
	@echo "$(CYAN)🚀 Starting application...$(RESET)"
	@VITE_API_URL=$(API_URL) docker compose up -d
	@echo "$(GREEN)✅ Application started!$(RESET)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "API URL: $(API_URL)"

up-build: ## 🔧 Build and start the application
	@echo "$(CYAN)🔨 Building and starting application...$(RESET)"
	@VITE_API_URL=$(API_URL) docker compose up --build -d
	@echo "$(GREEN)✅ Application built and started!$(RESET)"
	@echo "Frontend: http://localhost:3000"
	@echo "Backend: http://localhost:8000"
	@echo "API URL: $(API_URL)"

start: ## 🔧 Start existing containers
	@echo "$(CYAN)▶️  Starting containers...$(RESET)"
	@docker compose start
	@echo "$(GREEN)✅ Containers started!$(RESET)"

stop: ## 🔧 Stop containers (without removing them)
	@echo "$(CYAN)⏸️  Stopping containers...$(RESET)"
	@docker compose stop
	@echo "$(GREEN)✅ Containers stopped!$(RESET)"

down: ## 🔧 Stop and remove containers
	@echo "$(CYAN)🛑 Stopping and removing containers...$(RESET)"
	@docker compose down
	@echo "$(GREEN)✅ Containers stopped and removed!$(RESET)"

logs: ## 🔧 Show application logs
	@docker compose logs -f

logs-backend: ## 🔧 Show backend logs only
	@docker compose logs -f backend

logs-frontend: ## 🔧 Show frontend logs only
	@docker compose logs -f frontend

restart: ## 🔧 Restart the application
	@make down
	@make up

restart-build:
	@make down
	@make up-build

clean: ## 🔧 Clean up Docker resources
	@echo "$(CYAN)🧹 Cleaning up Docker resources...$(RESET)"
	@docker compose down -v
	@docker system prune -f
	@echo "$(GREEN)✅ Cleanup completed!$(RESET)"

# =============================================================================
# 🔧 Development Mode (Hot Reload)
# =============================================================================

dev-up: ## 🔧 Start application in dev mode with hot reload
	@echo "$(CYAN)🚀 Starting application in DEV mode with hot reload...$(RESET)"
	@VITE_API_URL=$(API_URL) docker compose -f docker-compose.dev.yml up --build -d
	@echo "$(GREEN)✅ Dev mode started with hot reload!$(RESET)"
	@echo "Frontend: http://localhost:3000 (hot reload enabled)"
	@echo "Backend: http://localhost:8000 (hot reload enabled)"
	@echo "API URL: $(API_URL)"
	@echo ""
	@echo "$(YELLOW)💡 Code changes will automatically reload the containers$(RESET)"

dev-down: ## 🔧 Stop dev mode containers
	@echo "$(CYAN)🛑 Stopping dev mode containers...$(RESET)"
	@docker compose -f docker-compose.dev.yml down
	@echo "$(GREEN)✅ Dev containers stopped!$(RESET)"

dev-logs: ## 🔧 Show dev mode logs
	@docker compose -f docker-compose.dev.yml logs -f

dev-logs-backend: ## 🔧 Show backend dev logs only
	@docker compose -f docker-compose.dev.yml logs -f backend

dev-logs-frontend: ## 🔧 Show frontend dev logs only
	@docker compose -f docker-compose.dev.yml logs -f frontend

dev-restart: ## 🔧 Restart dev mode
	@make dev-down
	@make dev-up

dev-shell-backend: ## 🔧 Open shell in backend dev container
	@docker compose -f docker-compose.dev.yml exec backend bash

dev-shell-frontend: ## 🔧 Open shell in frontend dev container
	@docker compose -f docker-compose.dev.yml exec frontend sh

# =============================================================================
# 📊 Data Management
# =============================================================================

scrape: ## 📊 Scrape data for specified symbol and timeframe
	@echo "$(CYAN)📊 Scraping $(SYMBOL) $(TIMEFRAME) data from $(EXCHANGE)...$(RESET)"
	@docker compose exec backend python scripts/scraper/ccxt_scraper.py \
		--symbol $(SYMBOL) \
		--timeframe $(TIMEFRAME) \
		--exchange $(EXCHANGE) \
		--start $(START_DATE) \
		--end $(END_DATE)

clear-cache: ## 📊 Clear market data cache
	@echo "$(CYAN)🧹 Clearing market data cache...$(RESET)"
	@docker compose exec backend rm -rf /app/app/backtesting/scraper/.cache
	@echo "$(GREEN)✅ Cache cleared!$(RESET)"



# =============================================================================
# 🧪 Backtesting
# =============================================================================

backtest: ## 🧪 Run backtest with specified strategy and parameters
	@echo "$(CYAN)🧪 Running backtest: $(STRATEGY) on $(SYMBOL)...$(RESET)"
	@# Use timeframe if timeframes is not explicitly set
	@FINAL_TIMEFRAMES="$(TIMEFRAMES)"; \
	if [ "$(TIMEFRAMES)" = "1h" ] && [ "$(TIMEFRAME)" != "1h" ]; then \
		FINAL_TIMEFRAMES="$(TIMEFRAME)"; \
	fi; \
	if [ "$(SAVE)" = "true" ]; then \
		echo "$(YELLOW)💾 Will save results to database$(RESET)"; \
		docker compose exec backend python scripts/backtest/flexible_backtest.py \
			--strategy $(STRATEGY) \
			--symbol $(SYMBOL) \
			--timeframes $$FINAL_TIMEFRAMES \
			--params '$(PARAMS)' \
			--cash $(CASH) \
			--save-to-db; \
	else \
		docker compose exec backend python scripts/backtest/flexible_backtest.py \
			--strategy $(STRATEGY) \
			--symbol $(SYMBOL) \
			--timeframes $$FINAL_TIMEFRAMES \
			--params '$(PARAMS)' \
			--cash $(CASH); \
	fi

# =============================================================================
# 📚 Information Commands
# =============================================================================

list-strategies: ## 📚 List all available strategies
	@echo "$(CYAN)📚 Available strategies:$(RESET)"
	@docker compose exec backend python scripts/backtest/flexible_backtest.py --list-strategies

strategy-info: ## 📚 Get detailed info about a strategy
	@echo "$(CYAN)📚 Strategy info for $(STRATEGY):$(RESET)"
	@docker compose exec backend python scripts/backtest/flexible_backtest.py --strategy-info $(STRATEGY)

list-data: ## 📚 List available data files
	@echo "$(CYAN)📚 Available data files:$(RESET)"
	@docker compose exec backend find /app/charts -name "*.csv" -type f | sort





# =============================================================================
# 🔧 Development & Testing
# =============================================================================

test-system: ## 🔧 Test the entire system
	@echo "$(CYAN)🔧 Testing system...$(RESET)"
	@make list-strategies
	@make strategy-info STRATEGY=simple_ma_cross
	@make list-data

shell-backend: ## 🔧 Open shell in backend container
	@docker compose exec backend bash

shell-frontend: ## 🔧 Open shell in frontend container
	@docker compose exec frontend sh

# =============================================================================
# 📋 Status & Monitoring
# =============================================================================

status: ## 📋 Show system status
	@echo "$(CYAN)📋 System Status:$(RESET)"
	@echo ""
	@echo "$(YELLOW)Docker Containers:$(RESET)"
	@docker compose ps
	@echo ""
	@echo "$(YELLOW)Available Data Files:$(RESET)"
	@make list-data 2>/dev/null | head -10
	@echo ""
	@echo "$(YELLOW)Available Strategies:$(RESET)"
	@make list-strategies 2>/dev/null



# =============================================================================
# 📖 Documentation
# =============================================================================

docs: ## 📖 Show documentation links
	@echo "$(CYAN)📖 Documentation:$(RESET)"
	@echo ""
	@echo "$(YELLOW)README Files:$(RESET)"
	@echo "  • backend/scripts/README.md - General scripts documentation"
	@echo "  • backend/scripts/backtest/README.md - Simple backtest documentation"
	@echo "  • backend/scripts/backtest/FLEXIBLE_README.md - Flexible backtest documentation"
	@echo ""
	@echo "$(YELLOW)Key Commands:$(RESET)"
	@echo "  • make help - Show this help"
	@echo "  • make status - Show system status"
	@echo "  • make list-strategies - Show available strategies"
	@echo "  • make backtest - Run backtest with strategy and parameters"
	@echo ""
	@echo "$(YELLOW)Web Interfaces:$(RESET)"
	@echo "  • Frontend: http://localhost:3000"
	@echo "  • Backend API: http://localhost:8000"