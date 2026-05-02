import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class AuditEventCreate(BaseModel):
    tenant_id: uuid.UUID
    actor_user_id: uuid.UUID | None = None
    entity_type: str
    entity_id: uuid.UUID
    action: str
    summary: str
    old_values_json: dict | None = None
    new_values_json: dict | None = None
    metadata_json: dict | None = None


class AuditEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    actor_user_id: uuid.UUID | None = None
    entity_type: str
    entity_id: uuid.UUID
    action: str
    summary: str
    old_values_json: dict | None = None
    new_values_json: dict | None = None
    metadata_json: dict | None = None
    created_at: datetime
    updated_at: datetime


class AuditEventListResponse(BaseModel):
    items: list[AuditEventResponse]
    total: int