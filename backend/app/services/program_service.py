import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.program import Program
from app.repositories.program import ProgramRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.program import ProgramCreate, ProgramUpdate
from app.services.audit_event_service import AuditEventService


class ProgramService:
    def __init__(self) -> None:
        self.repository = ProgramRepository()
        self.audit_service = AuditEventService()

    def create_program(self, db: Session, data: ProgramCreate) -> Program:
        if data.code:
            existing = self.repository.get_by_code(
                db=db,
                tenant_id=data.tenant_id,
                code=data.code,
            )

            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A program with that code already exists for this tenant.",
                )

        program = self.repository.create(db=db, data=data)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=program.tenant_id,
                actor_user_id=None,
                entity_type="program",
                entity_id=program.id,
                action="created",
                summary=f"Program {program.name} was created.",
                old_values_json=None,
                new_values_json={
                    "name": program.name,
                    "code": program.code,
                    "status": program.status,
                },
                metadata_json={
                    "source": "program_service.create_program",
                },
            ),
        )

        return program

    def get_program_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> Program:
        program = self.repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            program_id=program_id,
        )

        if not program:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Program not found for tenant.",
            )

        return program

    def list_programs_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
    ) -> tuple[list[Program], int]:
        items = self.repository.list_by_tenant(
            db=db,
            tenant_id=tenant_id,
        )

        return items, len(items)

    def update_program(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        program_id: uuid.UUID,
        data: ProgramUpdate,
    ) -> Program:
        program = self.get_program_for_tenant(
            db=db,
            tenant_id=tenant_id,
            program_id=program_id,
        )

        old_values = {
            "name": program.name,
            "code": program.code,
            "status": program.status,
            "description": program.description,
        }

        updated_program = self.repository.update(
            db=db,
            program=program,
            data=data,
        )

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=updated_program.tenant_id,
                actor_user_id=None,
                entity_type="program",
                entity_id=updated_program.id,
                action="updated",
                summary=f"Program {updated_program.name} was updated.",
                old_values_json=old_values,
                new_values_json={
                    "name": updated_program.name,
                    "code": updated_program.code,
                    "status": updated_program.status,
                    "description": updated_program.description,
                },
                metadata_json={
                    "source": "program_service.update_program",
                },
            ),
        )

        return updated_program