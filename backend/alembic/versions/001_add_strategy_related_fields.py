"""add strategy_related_fields column

Revision ID: 001
Revises: 
Create Date: 2024-02-25

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add strategy_related_fields column to backtest_results table
    op.add_column('backtest_results', sa.Column('strategy_related_fields', sa.JSON(), nullable=True))


def downgrade():
    # Remove strategy_related_fields column from backtest_results table
    op.drop_column('backtest_results', 'strategy_related_fields')
