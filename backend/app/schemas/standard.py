import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StandardBase(BaseModel):
    name: str
    revision: str | None = None
    issuing_body: str | None = None
    description: str | None = None
    status: str = "active"
    metadata_json: dict | None = None


class StandardCreate(StandardBase):
    tenant_id: uuid.UUID


class StandardUpdate(BaseModel):
    name: str | None = None
    revision: str | None = None
    issuing_body: str | None = None
    description: str | None = None
    status: str | None = None
    metadata_json: dict | None = None


class StandardResponse(StandardBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class StandardListResponse(BaseModel):
    items: list[StandardResponse]
    total: int