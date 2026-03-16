"""create base tables

Revision ID: 000
Revises:
Create Date: 2024-01-01

"""
from alembic import op
import sqlalchemy as sa

revision = '000'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'backtest_results',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('initial_balance', sa.Float(), nullable=True),
        sa.Column('final_balance', sa.Float(), nullable=True),
        sa.Column('total_trades', sa.Integer(), nullable=True),
        sa.Column('trading_days', sa.Integer(), nullable=True),
        sa.Column('value_at_risk', sa.Float(), nullable=True),
        sa.Column('win_rate', sa.Float(), nullable=True),
        sa.Column('profitable_trades', sa.Integer(), nullable=True),
        sa.Column('loss_trades', sa.Integer(), nullable=True),
        sa.Column('long_trades', sa.Integer(), nullable=True),
        sa.Column('short_trades', sa.Integer(), nullable=True),
        sa.Column('total_pnl', sa.Float(), nullable=True),
        sa.Column('average_pnl', sa.Float(), nullable=True),
        sa.Column('total_pnl_percentage', sa.Float(), nullable=True),
        sa.Column('average_pnl_percentage', sa.Float(), nullable=True),
        sa.Column('sharpe_ratio', sa.Float(), nullable=True),
        sa.Column('buy_hold_return', sa.Float(), nullable=True),
        sa.Column('profit_factor', sa.Float(), nullable=True),
        sa.Column('max_drawdown', sa.Float(), nullable=True),
        sa.Column('drawings', sa.JSON(), nullable=True),
    )

    op.create_table(
        'backtest_symbols',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('backtest_id', sa.Integer(), sa.ForeignKey('backtest_results.id', ondelete='CASCADE'), nullable=True),
        sa.Column('ticker', sa.String(), nullable=False),
        sa.Column('start_date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
    )

    op.create_table(
        'trades',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('backtest_id', sa.Integer(), sa.ForeignKey('backtest_results.id'), nullable=False),
        sa.Column('entry_time', sa.DateTime(), nullable=False),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('exit_time', sa.DateTime(), nullable=True),
        sa.Column('entry_price', sa.Float(), nullable=False),
        sa.Column('exit_price', sa.Float(), nullable=True),
        sa.Column('take_profit', sa.Float(), nullable=True),
        sa.Column('stop_loss', sa.Float(), nullable=True),
        sa.Column('pnl', sa.Float(), nullable=True),
        sa.Column('size', sa.Float(), nullable=False),
        sa.Column('trade_type', sa.String(), nullable=False),
        sa.Column('pnl_percentage', sa.Float(), nullable=True),
        sa.Column('exit_reason', sa.String(), nullable=True),
    )

    op.create_table(
        'undelivered_drawings',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('drawing_id', sa.String(), nullable=True),
        sa.Column('drawing_data', sa.JSON(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table('undelivered_drawings')
    op.drop_table('trades')
    op.drop_table('backtest_symbols')
    op.drop_table('backtest_results')
