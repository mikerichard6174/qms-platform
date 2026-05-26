import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class CdrlClauseMapping(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "cdrl_clause_mappings"
    __table_args__ = (
        UniqueConstraint(
            "cdrl_id",
            "standard_clause_id",
            name="uq_cdrl_clause_mapping",
        ),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )

    cdrl_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cdrls.id", ondelete="CASCADE"),
        nullable=False,
    )

    standard_clause_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("standard_clauses.id", ondelete="CASCADE"),
        nullable=False,
    )

    applicability: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="required",
    )

    rationale: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
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

    cdrl = relationship(
        "Cdrl",
        back_populates="clause_mappings",
    )

    standard_clause = relationship(
        "StandardClause",
    )