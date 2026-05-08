import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.auth_session import AuthSessionRepository
from app.schemas.auth_session import AuthRoleResponse, AuthSessionResponse


class AuthSessionService:
    def __init__(self) -> None:
        self.repository = AuthSessionRepository()

    def get_session(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> AuthSessionResponse:
        tenant = self.repository.get_active_tenant(
            db=db,
            tenant_id=tenant_id,
        )
        if not tenant:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active tenant not found.",
            )

        user = self.repository.get_active_user_for_tenant(
            db=db,
            tenant_id=tenant_id,
            user_id=user_id,
        )
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Active user not found for tenant.",
            )

        role_rows = self.repository.list_roles_for_user(
            db=db,
            tenant_id=tenant_id,
            user_id=user_id,
        )

        roles = [
            AuthRoleResponse(
                id=role.id,
                name=role.name,
                description=role.description,
                is_system_role=role.is_system_role,
                program_id=program_id,
            )
            for role, program_id in role_rows
        ]

        return AuthSessionResponse(
            tenant_id=tenant.id,
            tenant_name=tenant.name,
            tenant_slug=tenant.slug,
            user_id=user.id,
            email=user.email,
            full_name=user.full_name,
            roles=roles,
        )