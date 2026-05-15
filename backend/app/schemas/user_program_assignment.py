import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserProgramAssignmentBase(BaseModel):
    user_id: uuid.UUID
    program_id: uuid.UUID


class UserProgramAssignmentCreate(UserProgramAssignmentBase):
    tenant_id: uuid.UUID


class UserProgramAssignmentResponse(UserProgramAssignmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tenant_id: uuid.UUID
    created_at: datetime
    updated_at: datetime


class UserProgramAssignmentListResponse(BaseModel):
    items: list[UserProgramAssignmentResponse]
    total: int