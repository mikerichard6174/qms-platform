import uuid

from pydantic import BaseModel


class AuthRoleResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    is_system_role: bool
    program_id: uuid.UUID | None = None


class AuthSessionResponse(BaseModel):
    tenant_id: uuid.UUID
    tenant_name: str
    tenant_slug: str
    user_id: uuid.UUID
    email: str
    full_name: str
    roles: list[AuthRoleResponse]