import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DocumentRevisionBase(BaseModel):
    revision_label: str
    revision_number: int | None = None
    change_summary: str | None = None
    file_id: uuid.UUID | None = None
    status: str = "draft"
    is_current: bool = False
    is_effective: bool = False
    effective_date: date | None = None
    obsolete_date: date | None = None
    approved_by_user_id: uuid.UUID | None = None


class DocumentRevisionCreate(DocumentRevisionBase):
    document_id: uuid.UUID
    tenant_id: uuid.UUID
    created_by_user_id: uuid.UUID | None = None
    updated_by_user_id: uuid.UUID | None = None


class DocumentRevisionResponse(DocumentRevisionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    tenant_id: uuid.UUID
    submitted_for_approval_at: datetime | None = None
    approved_at: datetime | None = None
    created_by_user_id: uuid.UUID | None = None
    updated_by_user_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class DocumentRevisionListResponse(BaseModel):
    items: list[DocumentRevisionResponse]
    total: int