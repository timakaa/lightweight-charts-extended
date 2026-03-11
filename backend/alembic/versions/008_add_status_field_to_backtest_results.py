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
    op.add_column('backtest_results', sa.Column('status', sa.String(), nullable=True))
    
    # Remove is_live if it exists
    op.drop_column('backtest_results', 'is_live')

def downgrade():
    op.add_column('backtest_results', sa.Column('is_live', sa.Boolean(), nullable=True))
    op.drop_column('backtest_results', 'status')
