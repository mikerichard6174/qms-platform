import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.standard import Standard
from app.repositories.standard import StandardRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.standard import StandardCreate, StandardUpdate
from app.services.audit_event_service import AuditEventService


class StandardService:
    def __init__(self) -> None:
        self.repository = StandardRepository()
        self.audit_service = AuditEventService()

    def create_standard(
        self,
        db: Session,
        data: StandardCreate,
        actor_user_id: uuid.UUID | None = None,
    ) -> Standard:
        existing = self.repository.get_by_name_revision(
            db=db,
            tenant_id=data.tenant_id,
            name=data.name,
            revision=data.revision,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A standard with that name and revision already exists.",
            )

        standard = self.repository.create(db=db, data=data)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=standard.tenant_id,
                actor_user_id=actor_user_id,
                entity_type="standard",
                entity_id=standard.id,
                action="created",
                summary=f"Standard {standard.name} was created.",
                old_values_json=None,
                new_values_json={
                    "name": standard.name,
                    "revision": standard.revision,
                    "issuing_body": standard.issuing_body,
                    "status": standard.status,
                },
                metadata_json={
                    "source": "standard_service.create_standard",
                },
            ),
        )

        return standard

    def get_standard_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        standard_id: uuid.UUID,
    ) -> Standard:
        standard = self.repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            standard_id=standard_id,
        )

        if not standard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Standard not found for tenant.",
            )

        return standard

    def list_standards_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
    ) -> tuple[list[Standard], int]:
        items = self.repository.list_by_tenant(
            db=db,
            tenant_id=tenant_id,
        )

        return items, len(items)

    def update_standard(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        standard_id: uuid.UUID,
        data: StandardUpdate,
        actor_user_id: uuid.UUID | None = None,
    ) -> Standard:
        standard = self.get_standard_for_tenant(
            db=db,
            tenant_id=tenant_id,
            standard_id=standard_id,
        )

        old_values = {
            "name": standard.name,
            "revision": standard.revision,
            "issuing_body": standard.issuing_body,
            "description": standard.description,
            "status": standard.status,
        }

        updated_standard = self.repository.update(
            db=db,
            standard=standard,
            data=data,
        )

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=tenant_id,
                actor_user_id=actor_user_id,
                entity_type="standard",
                entity_id=updated_standard.id,
                action="updated",
                summary=f"Standard {updated_standard.name} was updated.",
                old_values_json=old_values,
                new_values_json={
                    "name": updated_standard.name,
                    "revision": updated_standard.revision,
                    "issuing_body": updated_standard.issuing_body,
                    "description": updated_standard.description,
                    "status": updated_standard.status,
                },
                metadata_json={
                    "source": "standard_service.update_standard",
                },
            ),
        )

        return updated_standard