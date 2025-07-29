# Simple MA Cross Strategy Backtest Makefile
# Run from project root with: docker-compose exec backend make -C scripts/backtest <target>

.PHONY: help backtest backtest-save backtest-scrape backtest-eth backtest-sol

help: ## Show this help message
	@echo "Simple MA Cross Strategy Backtest Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Usage from project root:"
	@echo "  docker-compose exec backend make -C scripts/backtest <target>"
	@echo ""
	@echo "Examples:"
	@echo "  docker-compose exec backend make -C scripts/backtest backtest"
	@echo "  docker-compose exec backend make -C scripts/backtest backtest-eth"
	@echo "  docker-compose exec backend make -C scripts/backtest backtest SYMBOL=SOLUSDT"

backtest: ## Run backtest with BTCUSDT (default)
	@python /app/scripts/backtest/run_backtest.py --symbol $(or $(SYMBOL),BTCUSDT) --cash $(or $(CASH),1000000)

backtest-save: ## Run backtest and save to database
	@python /app/scripts/backtest/run_backtest.py --symbol $(or $(SYMBOL),BTCUSDT) --cash $(or $(CASH),1000000) --save-to-db



backtest-eth: ## Run backtest with ETHUSDT
	@python /app/scripts/backtest/run_backtest.py --symbol ETHUSDT --cash $(or $(CASH),1000000)

backtest-sol: ## Run backtest with SOLUSDT
	@python /app/scripts/backtest/run_backtest.py --symbol SOLUSDT --cash $(or $(CASH),1000000)

backtest-4h: ## Run backtest with 4h timeframe
	@python /app/scripts/backtest/run_backtest.py --symbol $(or $(SYMBOL),BTCUSDT) --timeframe 4h --cash $(or $(CASH),1000000)

backtest-daily: ## Run backtest with daily timeframe
	@python /app/scripts/backtest/run_backtest.py --symbol $(or $(SYMBOL),BTCUSDT) --timeframe 1d --cash $(or $(CASH),1000000)