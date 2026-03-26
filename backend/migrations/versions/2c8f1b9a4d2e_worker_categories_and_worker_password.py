"""worker categories and worker password

Revision ID: 2c8f1b9a4d2e
Revises: 35af4a432bc1
Create Date: 2026-03-24

"""
from alembic import op
import sqlalchemy as sa


revision = "2c8f1b9a4d2e"
down_revision = "35af4a432bc1"
branch_labels = None
depends_on = None


DEFAULT_CATEGORIES = [
    "HR",
    "picker",
    "accountant",
    "loadman",
    "stock filler",
    "delivery person",
]


def upgrade():
    op.create_table(
        "worker_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    worker_categories = sa.table(
        "worker_categories",
        sa.column("name", sa.String(length=100)),
    )
    op.bulk_insert(worker_categories, [{"name": n} for n in DEFAULT_CATEGORIES])

    with op.batch_alter_table("workers", schema=None) as batch_op:
        batch_op.add_column(sa.Column("category_id", sa.Integer(), nullable=True))
        batch_op.add_column(sa.Column("password_hash", sa.String(length=255), nullable=True))
        batch_op.create_foreign_key(
            "fk_workers_worker_category_id",
            "worker_categories",
            ["category_id"],
            ["id"],
        )


def downgrade():
    with op.batch_alter_table("workers", schema=None) as batch_op:
        batch_op.drop_constraint("fk_workers_worker_category_id", type_="foreignkey")
        batch_op.drop_column("password_hash")
        batch_op.drop_column("category_id")

    op.drop_table("worker_categories")
