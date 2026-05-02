import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.schemas.audit_event import AuditEventListResponse, AuditEventResponse
from app.services.audit_event_service import AuditEventService

router = APIRouter(prefix="/audit-events", tags=["audit-events"])

service = AuditEventService()


@router.get("", response_model=AuditEventListResponse)
def list_audit_events(
    db: Session = Depends(get_db),
) -> AuditEventListResponse:
    items, total = service.list_events(db=db)
    return AuditEventListResponse(
        items=[AuditEventResponse.model_validate(item) for item in items],
        total=total,
    )


@router.get("/by-tenant/{tenant_id}", response_model=AuditEventListResponse)
def list_audit_events_for_tenant(
    tenant_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> AuditEventListResponse:
    items, total = service.list_events_for_tenant(db=db, tenant_id=tenant_id)
    return AuditEventListResponse(
        items=[AuditEventResponse.model_validate(item) for item in items],
        total=total,
    )


@router.get("/by-entity/{entity_type}/{entity_id}", response_model=AuditEventListResponse)
def list_audit_events_for_entity(
    entity_type: str,
    entity_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> AuditEventListResponse:
    items, total = service.list_events_for_entity(
        db=db,
        entity_type=entity_type,
        entity_id=entity_id,
    )
    return AuditEventListResponse(
        items=[AuditEventResponse.model_validate(item) for item in items],
        total=total,
    )