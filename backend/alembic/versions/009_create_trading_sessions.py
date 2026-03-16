"""create trading_sessions table and update trades

Revision ID: a1b2c3d4e5f6
Revises: 008
Create Date: 2026-03-17

"""
from alembic import op
import sqlalchemy as sa


revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'trading_sessions',
        sa.Column('id', sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('status', sa.String(), nullable=False, server_default='running'),
        sa.Column('is_paper', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('symbol', sa.String(), nullable=False),
        sa.Column('timeframe', sa.String(), nullable=False),
        sa.Column('strategy_name', sa.String(), nullable=False),
        sa.Column('strategy_parameters', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('stopped_at', sa.DateTime(), nullable=True),
        # Balance
        sa.Column('initial_balance', sa.Float(), nullable=False),
        sa.Column('current_balance', sa.Float(), nullable=False),
        # Trade counts
        sa.Column('total_trades', sa.Integer(), server_default='0'),
        sa.Column('long_trades', sa.Integer(), server_default='0'),
        sa.Column('short_trades', sa.Integer(), server_default='0'),
        sa.Column('profitable_trades', sa.Integer(), server_default='0'),
        sa.Column('loss_trades', sa.Integer(), server_default='0'),
        sa.Column('trading_days', sa.Integer(), server_default='0'),
        # PnL
        sa.Column('total_pnl', sa.Float(), server_default='0'),
        sa.Column('average_pnl', sa.Float(), server_default='0'),
        sa.Column('total_pnl_percentage', sa.Float(), server_default='0'),
        sa.Column('average_pnl_percentage', sa.Float(), server_default='0'),
        # Performance
        sa.Column('win_rate', sa.Float(), server_default='0'),
        sa.Column('sharpe_ratio', sa.Float(), nullable=True),
        sa.Column('profit_factor', sa.Float(), nullable=True),
        sa.Column('max_drawdown', sa.Float(), server_default='0'),
        sa.Column('buy_hold_return', sa.Float(), server_default='0'),
        # Shared result fields
        sa.Column('strategy_related_fields', sa.JSON(), nullable=True),
        sa.Column('drawings', sa.JSON(), nullable=True),
        sa.Column('chart_images', sa.JSON(), nullable=True),
    )

    # Use batch mode for SQLite compatibility
    with op.batch_alter_table('trades') as batch_op:
        batch_op.add_column(sa.Column('session_id', sa.Integer(), nullable=True))
        batch_op.create_foreign_key(
            'fk_trades_session_id',
            'trading_sessions',
            ['session_id'], ['id'],
            ondelete='CASCADE'
        )
        batch_op.alter_column('backtest_id', nullable=True)


def downgrade():
    with op.batch_alter_table('trades') as batch_op:
        batch_op.drop_constraint('fk_trades_session_id', type_='foreignkey')
        batch_op.drop_column('session_id')
        batch_op.alter_column('backtest_id', nullable=False)

    op.drop_table('trading_sessions')
