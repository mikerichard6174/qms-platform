import uuid

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class ProgramStandardMapping(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "program_standard_mappings"
    __table_args__ = (
        UniqueConstraint(
            "program_id",
            "standard_id",
            name="uq_program_standard_mapping",
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

    standard_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("standards.id", ondelete="CASCADE"),
        nullable=False,
    )

    applicability: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="required",
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

    program = relationship(
        "Program",
        back_populates="standard_mappings",
    )

    standard = relationship(
        "Standard",
        back_populates="program_mappings",
    )