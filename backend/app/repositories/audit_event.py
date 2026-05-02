import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.audit_event import AuditEvent
from app.schemas.audit_event import AuditEventCreate


class AuditEventRepository:
    def create(self, db: Session, data: AuditEventCreate) -> AuditEvent:
        event = AuditEvent(
            tenant_id=data.tenant_id,
            actor_user_id=data.actor_user_id,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            action=data.action,
            summary=data.summary,
            old_values_json=data.old_values_json,
            new_values_json=data.new_values_json,
            metadata_json=data.metadata_json,
        )

        db.add(event)
        db.commit()
        db.refresh(event)

        return event

    def list_all(self, db: Session) -> list[AuditEvent]:
        stmt = select(AuditEvent).order_by(AuditEvent.created_at.desc())
        return list(db.scalars(stmt).all())

    def list_by_entity(
        self,
        db: Session,
        entity_type: str,
        entity_id: uuid.UUID,
    ) -> list[AuditEvent]:
        stmt = (
            select(AuditEvent)
            .where(
                AuditEvent.entity_type == entity_type,
                AuditEvent.entity_id == entity_id,
            )
            .order_by(AuditEvent.created_at.desc())
        )
        return list(db.scalars(stmt).all())

    def list_by_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
    ) -> list[AuditEvent]:
        stmt = (
            select(AuditEvent)
            .where(AuditEvent.tenant_id == tenant_id)
            .order_by(AuditEvent.created_at.desc())
        )
        return list(db.scalars(stmt).all())