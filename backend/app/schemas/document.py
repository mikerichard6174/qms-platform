import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DocumentBase(BaseModel):
    document_number: str
    title: str
    document_type: str
    status: str = "draft"
    is_controlled: bool = True
    review_due_date: date | None = None
    metadata_json: dict | None = None
    program_id: uuid.UUID | None = None
    owner_user_id: uuid.UUID | None = None


class DocumentCreate(DocumentBase):
    tenant_id: uuid.UUID
    created_by_user_id: uuid.UUID | None = None
    updated_by_user_id: uuid.UUID | None = None


class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    current_revision_id: uuid.UUID | None = None
    created_by_user_id: uuid.UUID | None = None
    updated_by_user_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime


class DocumentListResponse(BaseModel):
    items: list[DocumentResponse]
    total: int