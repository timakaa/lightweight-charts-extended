"""add capital efficiency metrics

Revision ID: 002
Revises: 001
Create Date: 2024-02-26

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002'
down_revision = '001'
branch_labels = None
depends_on = None


def upgrade():
    # Add capital efficiency metrics to backtest_results table
    op.add_column('backtest_results', sa.Column('capital_deployed', sa.Float(), nullable=True))
    op.add_column('backtest_results', sa.Column('capital_utilization', sa.Float(), nullable=True))
    op.add_column('backtest_results', sa.Column('roic', sa.Float(), nullable=True))


def downgrade():
    # Remove capital efficiency metrics from backtest_results table
    op.drop_column('backtest_results', 'roic')
    op.drop_column('backtest_results', 'capital_utilization')
    op.drop_column('backtest_results', 'capital_deployed')
