"""remove capital metrics

Revision ID: 007
Revises: 006
Create Date: 2025-01-08

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Remove capital efficiency metrics from backtest_results table
    # These metrics are confusing and not standard for trading strategies
    op.drop_column('backtest_results', 'capital_deployed')
    op.drop_column('backtest_results', 'capital_utilization')
    op.drop_column('backtest_results', 'roic')
    op.drop_column('backtest_results', 'buy_hold_return_deployed')


def downgrade():
    # Add back capital efficiency metrics to backtest_results table
    op.add_column('backtest_results', sa.Column('capital_deployed', sa.Float(), nullable=True))
    op.add_column('backtest_results', sa.Column('capital_utilization', sa.Float(), nullable=True))
    op.add_column('backtest_results', sa.Column('roic', sa.Float(), nullable=True))
    op.add_column('backtest_results', sa.Column('buy_hold_return_deployed', sa.Float(), nullable=True))
