import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.api.deps.user_context import require_user_id_header
from app.schemas.standard import (
    StandardCreate,
    StandardListResponse,
    StandardResponse,
    StandardUpdate,
)
from app.services.standard_service import StandardService

router = APIRouter(prefix="/standards", tags=["standards"])

service = StandardService()


@router.post(
    "",
    response_model=StandardResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_standard(
    payload: StandardCreate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> StandardResponse:
    payload.tenant_id = tenant_id

    standard = service.create_standard(
        db=db,
        data=payload,
        actor_user_id=user_id,
    )

    return StandardResponse.model_validate(standard)


@router.get("", response_model=StandardListResponse)
def list_standards(
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> StandardListResponse:
    items, total = service.list_standards_for_tenant(
        db=db,
        tenant_id=tenant_id,
    )

    return StandardListResponse(
        items=[StandardResponse.model_validate(item) for item in items],
        total=total,
    )


@router.get("/{standard_id}", response_model=StandardResponse)
def get_standard(
    standard_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> StandardResponse:
    standard = service.get_standard_for_tenant(
        db=db,
        tenant_id=tenant_id,
        standard_id=standard_id,
    )

    return StandardResponse.model_validate(standard)


@router.put("/{standard_id}", response_model=StandardResponse)
def update_standard(
    standard_id: uuid.UUID,
    payload: StandardUpdate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> StandardResponse:
    standard = service.update_standard(
        db=db,
        tenant_id=tenant_id,
        standard_id=standard_id,
        data=payload,
        actor_user_id=user_id,
    )

    return StandardResponse.model_validate(standard)