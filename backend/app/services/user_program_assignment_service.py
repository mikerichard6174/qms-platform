import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.user_program_assignment import UserProgramAssignment
from app.repositories.program import ProgramRepository
from app.repositories.user_program_assignment import (
    UserProgramAssignmentRepository,
)
from app.schemas.audit_event import AuditEventCreate
from app.schemas.user_program_assignment import (
    UserProgramAssignmentCreate,
)
from app.services.audit_event_service import AuditEventService


class UserProgramAssignmentService:
    def __init__(self) -> None:
        self.repository = UserProgramAssignmentRepository()
        self.program_repository = ProgramRepository()
        self.audit_service = AuditEventService()

    def assign_user_to_program(
        self,
        db: Session,
        data: UserProgramAssignmentCreate,
    ) -> UserProgramAssignment:
        existing = self.repository.get_existing(
            db=db,
            tenant_id=data.tenant_id,
            user_id=data.user_id,
            program_id=data.program_id,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User is already assigned to this program.",
            )

        program = self.program_repository.get_by_tenant_and_id(
            db=db,
            tenant_id=data.tenant_id,
            program_id=data.program_id,
        )

        if not program:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Program not found for tenant.",
            )

        assignment = self.repository.create(
            db=db,
            data=data,
        )

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=data.tenant_id,
                actor_user_id=None,
                entity_type="user_program_assignment",
                entity_id=assignment.id,
                action="created",
                summary=(
                    f"User {data.user_id} assigned to program "
                    f"{program.name}."
                ),
                old_values_json=None,
                new_values_json={
                    "user_id": str(data.user_id),
                    "program_id": str(data.program_id),
                },
                metadata_json={
                    "program_name": program.name,
                },
            ),
        )

        return assignment

    def list_assignments_for_user(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> tuple[list[UserProgramAssignment], int]:
        items = self.repository.list_by_user(
            db=db,
            tenant_id=tenant_id,
            user_id=user_id,
        )

        return items, len(items)

    def get_program_ids_for_user(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> list[uuid.UUID]:
        return self.repository.list_program_ids_for_user(
            db=db,
            tenant_id=tenant_id,
            user_id=user_id,
        )