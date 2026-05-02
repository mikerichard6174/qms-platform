import uuid

from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent
from app.repositories.audit_event import AuditEventRepository
from app.schemas.audit_event import AuditEventCreate


class AuditEventService:
    def __init__(self) -> None:
        self.repository = AuditEventRepository()

    def create_event(self, db: Session, data: AuditEventCreate) -> AuditEvent:
        return self.repository.create(db=db, data=data)

    def list_events(self, db: Session) -> tuple[list[AuditEvent], int]:
        items = self.repository.list_all(db=db)
        return items, len(items)

    def list_events_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
    ) -> tuple[list[AuditEvent], int]:
        items = self.repository.list_by_tenant(db=db, tenant_id=tenant_id)
        return items, len(items)

    def list_events_for_entity(
        self,
        db: Session,
        entity_type: str,
        entity_id: uuid.UUID,
    ) -> tuple[list[AuditEvent], int]:
        items = self.repository.list_by_entity(
            db=db,
            entity_type=entity_type,
            entity_id=entity_id,
        )
        return items, len(items)