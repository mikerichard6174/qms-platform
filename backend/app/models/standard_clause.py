import uuid

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class StandardClause(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "standard_clauses"
    __table_args__ = (
        UniqueConstraint(
            "standard_id",
            "clause_number",
            name="uq_standard_clause_number",
        ),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )

    standard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("standards.id", ondelete="CASCADE"),
        nullable=False,
    )

    parent_clause_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("standard_clauses.id", ondelete="SET NULL"),
        nullable=True,
    )

    clause_number: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    title: Mapped[str] = mapped_column(
        String(500),
        nullable=False,
    )

    summary: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    audit_guidance: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    evidence_examples: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="active",
    )

    metadata_json: Mapped[dict | None] = mapped_column(
        JSONB,
        nullable=True,
    )

    standard = relationship(
        "Standard",
        back_populates="clauses",
    )

    parent_clause = relationship(
        "StandardClause",
        remote_side="StandardClause.id",
        backref="child_clauses",
    )