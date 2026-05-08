import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.role import Role
from app.models.tenant import Tenant
from app.models.user import User
from app.models.user_role_assignment import UserRoleAssignment


class AuthSessionRepository:
    def get_active_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
    ) -> Tenant | None:
        stmt = select(Tenant).where(
            Tenant.id == tenant_id,
            Tenant.status == "active",
        )
        return db.scalar(stmt)

    def get_active_user_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> User | None:
        stmt = select(User).where(
            User.id == user_id,
            User.tenant_id == tenant_id,
            User.is_active.is_(True),
        )
        return db.scalar(stmt)

    def list_roles_for_user(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> list[tuple[Role, uuid.UUID | None]]:
        stmt = (
            select(Role, UserRoleAssignment.program_id)
            .join(UserRoleAssignment, UserRoleAssignment.role_id == Role.id)
            .where(
                UserRoleAssignment.tenant_id == tenant_id,
                UserRoleAssignment.user_id == user_id,
            )
            .order_by(Role.name.asc())
        )
        return list(db.execute(stmt).all())