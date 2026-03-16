"""add status field to backtest_results

Revision ID: fd7358112b35
Revises: 007
Create Date: 2026-03-11 10:14:28.745274

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    # status was added here but removed in 009 (moved to trading_sessions)
    # is_live was never in the migration chain, skip both operations
    pass

def downgrade():
    pass
