import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.schemas.audit_event import AuditEventListResponse, AuditEventResponse
from app.services.audit_event_service import AuditEventService

router = APIRouter(prefix="/audit-events", tags=["audit-events"])

service = AuditEventService()


@router.get("", response_model=AuditEventListResponse)
def list_audit_events(
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> AuditEventListResponse:
    items, total = service.list_events_for_tenant(
        db=db,
        tenant_id=tenant_id,
        limit=limit,
        offset=offset,
    )

    return AuditEventListResponse(
        items=[AuditEventResponse.model_validate(item) for item in items],
        total=total,
    )


@router.get("/by-tenant/{requested_tenant_id}", response_model=AuditEventListResponse)
def list_audit_events_for_tenant(
    requested_tenant_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> AuditEventListResponse:
    if requested_tenant_id != tenant_id:
        return AuditEventListResponse(items=[], total=0)

    items, total = service.list_events_for_tenant(
        db=db,
        tenant_id=tenant_id,
        limit=limit,
        offset=offset,
    )
    return AuditEventListResponse(
        items=[AuditEventResponse.model_validate(item) for item in items],
        total=total,
    )


@router.get("/by-entity/{entity_type}/{entity_id}", response_model=AuditEventListResponse)
def list_audit_events_for_entity(
    entity_type: str,
    entity_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> AuditEventListResponse:
    items, total = service.list_events_for_tenant_and_entity(
        db=db,
        tenant_id=tenant_id,
        entity_type=entity_type,
        entity_id=entity_id,
        limit=limit,
        offset=offset,
    )
    return AuditEventListResponse(
        items=[AuditEventResponse.model_validate(item) for item in items],
        total=total,
    )