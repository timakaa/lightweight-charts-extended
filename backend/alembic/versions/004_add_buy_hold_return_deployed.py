"""add buy_hold_return_deployed column

Revision ID: 004
Revises: 003
Create Date: 2025-02-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Add buy_hold_return_deployed column to backtest_results table
    op.add_column('backtest_results', sa.Column('buy_hold_return_deployed', sa.Float(), nullable=True))


def downgrade():
    # Remove buy_hold_return_deployed column
    op.drop_column('backtest_results', 'buy_hold_return_deployed')
