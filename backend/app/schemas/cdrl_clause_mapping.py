import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class CdrlClauseMappingBase(BaseModel):
    cdrl_id: uuid.UUID
    standard_clause_id: uuid.UUID
    applicability: str = "required"
    rationale: str | None = None
    status: str = "active"
    metadata_json: dict | None = None


class CdrlClauseMappingCreate(CdrlClauseMappingBase):
    tenant_id: uuid.UUID


class CdrlClauseMappingUpdate(BaseModel):
    applicability: str | None = None
    rationale: str | None = None
    status: str | None = None
    metadata_json: dict | None = None


class CdrlClauseMappingResponse(CdrlClauseMappingBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class CdrlClauseMappingListResponse(BaseModel):
    items: list[CdrlClauseMappingResponse]
    total: int