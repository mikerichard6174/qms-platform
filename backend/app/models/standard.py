import uuid

from sqlalchemy import ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.db.mixins import TimestampMixin, UUIDPrimaryKeyMixin


class Standard(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "standards"
    __table_args__ = (
        UniqueConstraint(
            "tenant_id",
            "name",
            "revision",
            name="uq_standards_tenant_name_revision",
        ),
    )

    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    revision: Mapped[str | None] = mapped_column(String(100), nullable=True)
    issuing_body: Mapped[str | None] = mapped_column(String(255), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, default="active")
    metadata_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    clauses = relationship(
        "StandardClause",
        back_populates="standard",
        cascade="all, delete-orphan",
    )

    program_mappings = relationship(
        "ProgramStandardMapping",
        back_populates="standard",
        cascade="all, delete-orphan",
    )