import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StandardClauseBase(BaseModel):
    standard_id: uuid.UUID
    parent_clause_id: uuid.UUID | None = None
    clause_number: str
    title: str
    summary: str | None = None
    audit_guidance: str | None = None
    evidence_examples: str | None = None
    sort_order: int = 0
    status: str = "active"
    metadata_json: dict | None = None


class StandardClauseCreate(StandardClauseBase):
    tenant_id: uuid.UUID


class StandardClauseUpdate(BaseModel):
    parent_clause_id: uuid.UUID | None = None
    clause_number: str | None = None
    title: str | None = None
    summary: str | None = None
    audit_guidance: str | None = None
    evidence_examples: str | None = None
    sort_order: int | None = None
    status: str | None = None
    metadata_json: dict | None = None


class StandardClauseResponse(StandardClauseBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class StandardClauseListResponse(BaseModel):
    items: list[StandardClauseResponse]
    total: int