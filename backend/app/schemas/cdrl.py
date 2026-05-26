import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class CdrlBase(BaseModel):
    program_id: uuid.UUID
    cdrl_number: str
    title: str
    description: str | None = None
    deliverable_type: str | None = None
    frequency: str | None = None
    due_date: date | None = None
    status: str = "active"
    owner_user_id: uuid.UUID | None = None
    metadata_json: dict | None = None


class CdrlCreate(CdrlBase):
    tenant_id: uuid.UUID


class CdrlUpdate(BaseModel):
    cdrl_number: str | None = None
    title: str | None = None
    description: str | None = None
    deliverable_type: str | None = None
    frequency: str | None = None
    due_date: date | None = None
    status: str | None = None
    owner_user_id: uuid.UUID | None = None
    metadata_json: dict | None = None


class CdrlResponse(CdrlBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CdrlListResponse(BaseModel):
    items: list[CdrlResponse]
    total: int