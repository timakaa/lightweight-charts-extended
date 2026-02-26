import math
from typing import Any, Optional, Dict, List
from app.models.backtest_results import BacktestResult
from app.models.trade import Trade


class BacktestSerializer:
    @staticmethod
    def convert_nan_to_none(obj: Any) -> Any:
        """Convert NaN values to None for JSON serialization"""
        if isinstance(obj, float) and math.isnan(obj):
            return None
        elif isinstance(obj, dict):
            return {
                key: BacktestSerializer.convert_nan_to_none(value)
                for key, value in obj.items()
            }
        elif isinstance(obj, list):
            return [BacktestSerializer.convert_nan_to_none(item) for item in obj]
        return obj

    @staticmethod
    def serialize_backtest(backtest: Optional[BacktestResult]) -> Optional[Dict[str, Any]]:
        """Convert backtest model to dict with NaN handling"""
        if not backtest:
            return None

        result = {
            "id": backtest.id,
            "created_at": (
                backtest.created_at.isoformat()
                if backtest.created_at is not None
                else None
            ),
            "start_date": (
                backtest.start_date.isoformat()
                if backtest.start_date is not None
                else None
            ),
            "end_date": (
                backtest.end_date.isoformat() if backtest.end_date is not None else None
            ),
            "title": backtest.title,
            "is_live": backtest.is_live,
            "initial_balance": backtest.initial_balance,
            "final_balance": backtest.final_balance,
            "total_trades": backtest.total_trades,
            "trading_days": backtest.trading_days,
            "value_at_risk": backtest.value_at_risk,
            "win_rate": backtest.win_rate,
            "profitable_trades": backtest.profitable_trades,
            "loss_trades": backtest.loss_trades,
            "long_trades": backtest.long_trades,
            "short_trades": backtest.short_trades,
            "capital_deployed": backtest.capital_deployed,
            "capital_utilization": backtest.capital_utilization,
            "roic": backtest.roic,
            "total_pnl": backtest.total_pnl,
            "average_pnl": backtest.average_pnl,
            "total_pnl_percentage": backtest.total_pnl_percentage,
            "average_pnl_percentage": backtest.average_pnl_percentage,
            "sharpe_ratio": backtest.sharpe_ratio,
            "buy_hold_return": backtest.buy_hold_return,
            "profit_factor": backtest.profit_factor,
            "max_drawdown": backtest.max_drawdown,
            "strategy_related_fields": backtest.strategy_related_fields,
            "drawings": backtest.drawings,
            "symbols": (
                [
                    {
                        "id": symbol.id,
                        "ticker": symbol.ticker,
                        "start_date": (
                            symbol.start_date.isoformat()
                            if symbol.start_date is not None
                            else None
                        ),
                        "end_date": (
                            symbol.end_date.isoformat()
                            if symbol.end_date is not None
                            else None
                        ),
                    }
                    for symbol in backtest.symbols
                ]
                if backtest.symbols
                else []
            ),
        }

        return BacktestSerializer.convert_nan_to_none(result)

    @staticmethod
    def serialize_backtest_summary(backtest: BacktestResult) -> Dict[str, Any]:
        """Serialize backtest for list view"""
        return {
            "id": backtest.id,
            "title": backtest.title,
            "created_at": (
                backtest.created_at.isoformat()
                if backtest.created_at is not None
                else None
            ),
            "total_pnl_percentage": backtest.total_pnl_percentage,
            "is_live": backtest.is_live,
            "symbols": [
                {
                    "ticker": symbol.ticker,
                    "start_date": (
                        symbol.start_date.isoformat() if symbol.start_date else None
                    ),
                    "end_date": (
                        symbol.end_date.isoformat() if symbol.end_date else None
                    ),
                }
                for symbol in backtest.symbols
            ],
        }

    @staticmethod
    def serialize_backtest_stats(backtest: BacktestResult) -> Dict[str, Any]:
        """Serialize backtest statistics only"""
        result = {
            "title": backtest.title,
            "start_date": (
                backtest.start_date.isoformat()
                if backtest.start_date is not None
                else None
            ),
            "end_date": (
                backtest.end_date.isoformat() if backtest.end_date is not None else None
            ),
            "initial_balance": backtest.initial_balance,
            "final_balance": backtest.final_balance,
            "total_trades": backtest.total_trades,
            "trading_days": backtest.trading_days,
            "value_at_risk": backtest.value_at_risk,
            "win_rate": backtest.win_rate,
            "profitable_trades": backtest.profitable_trades,
            "loss_trades": backtest.loss_trades,
            "long_trades": backtest.long_trades,
            "short_trades": backtest.short_trades,
            "capital_deployed": backtest.capital_deployed,
            "capital_utilization": backtest.capital_utilization,
            "roic": backtest.roic,
            "total_pnl": backtest.total_pnl,
            "average_pnl": backtest.average_pnl,
            "total_pnl_percentage": backtest.total_pnl_percentage,
            "average_pnl_percentage": backtest.average_pnl_percentage,
            "sharpe_ratio": backtest.sharpe_ratio,
            "buy_hold_return": backtest.buy_hold_return,
            "profit_factor": backtest.profit_factor,
            "max_drawdown": backtest.max_drawdown,
            "strategy_related_fields": backtest.strategy_related_fields,
        }
        return BacktestSerializer.convert_nan_to_none(result)

    @staticmethod
    def serialize_trade(trade: Trade) -> Dict[str, Any]:
        """Serialize a single trade"""
        return {
            "id": trade.id,
            "symbol": trade.symbol,
            "entry_time": (
                trade.entry_time.isoformat() if trade.entry_time is not None else None
            ),
            "exit_time": (
                trade.exit_time.isoformat() if trade.exit_time is not None else None
            ),
            "entry_price": trade.entry_price,
            "exit_price": trade.exit_price,
            "take_profit": trade.take_profit,
            "stop_loss": trade.stop_loss,
            "pnl": trade.pnl,
            "size": trade.size,
            "trade_type": trade.trade_type,
            "pnl_percentage": trade.pnl_percentage,
            "exit_reason": trade.exit_reason,
        }

    @staticmethod
    def serialize_symbol(symbol) -> Dict[str, Any]:
        """Serialize a backtest symbol"""
        return {
            "ticker": symbol.ticker,
            "start_date": symbol.start_date.isoformat() if symbol.start_date else None,
            "end_date": symbol.end_date.isoformat() if symbol.end_date else None,
        }
