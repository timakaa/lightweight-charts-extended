"""add chart_images column

Revision ID: 003
Revises: 002
Create Date: 2025-02-27

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade():
    # Add chart_images column to backtest_results table
    op.add_column('backtest_results', sa.Column('chart_images', sa.JSON(), nullable=True))


def downgrade():
    # Remove chart_images column
    op.drop_column('backtest_results', 'chart_images')
