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
        existing = self.repository.get_existing_assignment(
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

        assignment = self.repository.create(db=db, data=data)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=data.tenant_id,
                actor_user_id=None,
                entity_type="user_program_assignment",
                entity_id=assignment.id,
                action="created",
                summary=f"User {data.user_id} assigned to program {program.name}.",
                old_values_json=None,
                new_values_json={
                    "user_id": str(data.user_id),
                    "program_id": str(data.program_id),
                    "program_name": program.name,
                    "program_code": program.code,
                },
                metadata_json={
                    "source": "user_program_assignment_service.assign_user_to_program",
                    "program_id": str(program.id),
                },
            ),
        )

        return assignment

    def revoke_user_program_assignment(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        actor_user_id: uuid.UUID,
        assignment_id: uuid.UUID,
    ) -> None:
        assignment = self.repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            assignment_id=assignment_id,
        )

        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User program assignment not found for tenant.",
            )

        program = self.program_repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            program_id=assignment.program_id,
        )

        old_values = {
            "user_id": str(assignment.user_id),
            "program_id": str(assignment.program_id),
            "program_name": program.name if program else None,
            "program_code": program.code if program else None,
        }

        self.repository.delete(db=db, assignment=assignment)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=tenant_id,
                actor_user_id=actor_user_id,
                entity_type="user_program_assignment",
                entity_id=assignment_id,
                action="revoked",
                summary=(
                    f"Program access was revoked for user "
                    f"{old_values['user_id']}."
                ),
                old_values_json=old_values,
                new_values_json=None,
                metadata_json={
                    "source": "user_program_assignment_service.revoke_user_program_assignment",
                    "program_id": old_values["program_id"],
                },
            ),
        )

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