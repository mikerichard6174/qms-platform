import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.program_standard_mapping import ProgramStandardMapping
from app.repositories.program import ProgramRepository
from app.repositories.program_standard_mapping import (
    ProgramStandardMappingRepository,
)
from app.repositories.standard import StandardRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.program_standard_mapping import (
    ProgramStandardMappingCreate,
    ProgramStandardMappingUpdate,
)
from app.services.audit_event_service import AuditEventService


class ProgramStandardMappingService:
    def __init__(self) -> None:
        self.repository = ProgramStandardMappingRepository()
        self.program_repository = ProgramRepository()
        self.standard_repository = StandardRepository()
        self.audit_service = AuditEventService()

    def create_mapping(
        self,
        db: Session,
        data: ProgramStandardMappingCreate,
        actor_user_id: uuid.UUID | None = None,
    ) -> ProgramStandardMapping:
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

        standard = self.standard_repository.get_by_tenant_and_id(
            db=db,
            tenant_id=data.tenant_id,
            standard_id=data.standard_id,
        )

        if not standard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Standard not found for tenant.",
            )

        existing = self.repository.get_existing_mapping(
            db=db,
            tenant_id=data.tenant_id,
            program_id=data.program_id,
            standard_id=data.standard_id,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Program is already assigned to this standard.",
            )

        mapping = self.repository.create(db=db, data=data)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=mapping.tenant_id,
                actor_user_id=actor_user_id,
                entity_type="program_standard_mapping",
                entity_id=mapping.id,
                action="created",
                summary=(
                    f"Standard {standard.name} assigned to "
                    f"program {program.name}."
                ),
                old_values_json=None,
                new_values_json={
                    "program_id": str(mapping.program_id),
                    "program_name": program.name,
                    "standard_id": str(mapping.standard_id),
                    "standard_name": standard.name,
                    "applicability": mapping.applicability,
                    "status": mapping.status,
                },
                metadata_json={
                    "source": "program_standard_mapping_service.create_mapping",
                },
            ),
        )

        return mapping

    def get_mapping_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        mapping_id: uuid.UUID,
    ) -> ProgramStandardMapping:
        mapping = self.repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            mapping_id=mapping_id,
        )

        if not mapping:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Program standard mapping not found for tenant.",
            )

        return mapping

    def list_mappings_for_program(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> tuple[list[ProgramStandardMapping], int]:
        program = self.program_repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            program_id=program_id,
        )

        if not program:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Program not found for tenant.",
            )

        items = self.repository.list_by_program(
            db=db,
            tenant_id=tenant_id,
            program_id=program_id,
        )

        return items, len(items)

    def update_mapping(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        mapping_id: uuid.UUID,
        data: ProgramStandardMappingUpdate,
        actor_user_id: uuid.UUID | None = None,
    ) -> ProgramStandardMapping:
        mapping = self.get_mapping_for_tenant(
            db=db,
            tenant_id=tenant_id,
            mapping_id=mapping_id,
        )

        old_values = {
            "applicability": mapping.applicability,
            "status": mapping.status,
        }

        updated_mapping = self.repository.update(
            db=db,
            mapping=mapping,
            data=data,
        )

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=tenant_id,
                actor_user_id=actor_user_id,
                entity_type="program_standard_mapping",
                entity_id=updated_mapping.id,
                action="updated",
                summary="Program standard mapping updated.",
                old_values_json=old_values,
                new_values_json={
                    "applicability": updated_mapping.applicability,
                    "status": updated_mapping.status,
                },
                metadata_json={
                    "source": "program_standard_mapping_service.update_mapping",
                    "program_id": str(updated_mapping.program_id),
                    "standard_id": str(updated_mapping.standard_id),
                },
            ),
        )

        return updated_mapping