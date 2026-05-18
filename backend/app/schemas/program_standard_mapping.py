import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProgramStandardMappingBase(BaseModel):
    program_id: uuid.UUID
    standard_id: uuid.UUID
    applicability: str = "required"
    status: str = "active"
    metadata_json: dict | None = None


class ProgramStandardMappingCreate(ProgramStandardMappingBase):
    tenant_id: uuid.UUID


class ProgramStandardMappingUpdate(BaseModel):
    applicability: str | None = None
    status: str | None = None
    metadata_json: dict | None = None


class ProgramStandardMappingResponse(ProgramStandardMappingBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class ProgramStandardMappingListResponse(BaseModel):
    items: list[ProgramStandardMappingResponse]
    total: int