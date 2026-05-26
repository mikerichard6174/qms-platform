import uuid
from datetime import date

from sqlalchemy import Date, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Cdrl(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "cdrls"
    __table_args__ = (
        UniqueConstraint(
            "program_id",
            "cdrl_number",
            name="uq_cdrl_program_number",
        ),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )

    program_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("programs.id", ondelete="CASCADE"),
        nullable=False,
    )

    cdrl_number: Mapped[str] = mapped_column(String(100), nullable=False)

    title: Mapped[str] = mapped_column(String(500), nullable=False)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    deliverable_type: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    frequency: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="active",
    )

    owner_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    program = relationship(
        "Program",
        back_populates="cdrls",
    )

    clause_mappings = relationship(
        "CdrlClauseMapping",
        back_populates="cdrl",
        cascade="all, delete-orphan",
    )