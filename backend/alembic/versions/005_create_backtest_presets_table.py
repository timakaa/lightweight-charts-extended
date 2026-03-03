"""create backtest_presets table

Revision ID: 005
Revises: 004
Create Date: 2025-03-02

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '005'
down_revision = '004'
branch_labels = None
depends_on = None


def upgrade():
    # Create backtest_presets table
    op.create_table(
        'backtest_presets',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('timeframe', sa.String(), nullable=False),
        sa.Column('start_date', sa.String(), nullable=False),
        sa.Column('end_date', sa.String(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )


def downgrade():
    # Drop backtest_presets table
    op.drop_table('backtest_presets')
