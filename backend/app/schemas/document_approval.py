import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class DocumentApprovalBase(BaseModel):
    approval_type: str = "approval"
    status: str = "pending"
    comment: str | None = None


class DocumentApprovalCreate(DocumentApprovalBase):
    document_revision_id: uuid.UUID
    tenant_id: uuid.UUID
    approver_user_id: uuid.UUID


class DocumentApprovalAction(BaseModel):
    comment: str | None = None


class DocumentApprovalResponse(DocumentApprovalBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_revision_id: uuid.UUID
    tenant_id: uuid.UUID
    approver_user_id: uuid.UUID
    acted_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class DocumentApprovalListResponse(BaseModel):
    items: list[DocumentApprovalResponse]
    total: int