import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class ProgramBase(BaseModel):
    name: str
    code: str | None = None
    description: str | None = None
    status: str = "active"
    start_date: date | None = None
    end_date: date | None = None
    metadata_json: dict | None = None


class ProgramCreate(ProgramBase):
    tenant_id: uuid.UUID


class ProgramUpdate(BaseModel):
    name: str | None = None
    code: str | None = None
    description: str | None = None
    status: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    metadata_json: dict | None = None


class ProgramResponse(ProgramBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ProgramListResponse(BaseModel):
    items: list[ProgramResponse]
    total: int