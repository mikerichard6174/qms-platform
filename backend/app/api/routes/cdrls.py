import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.schemas.cdrl import (
    CdrlCreate,
    CdrlListResponse,
    CdrlResponse,
    CdrlUpdate,
)
from app.services.cdrl_service import CdrlService

router = APIRouter(
    prefix="/cdrls",
    tags=["cdrls"],
)

service = CdrlService()


@router.post(
    "",
    response_model=CdrlResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_cdrl(
    payload: CdrlCreate,
    db: Session = Depends(get_db),
) -> CdrlResponse:
    cdrl = service.create_cdrl(
        db=db,
        data=payload,
    )

    return CdrlResponse.model_validate(cdrl)


@router.get(
    "/by-program/{program_id}",
    response_model=CdrlListResponse,
)
def list_cdrls_for_program(
    program_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> CdrlListResponse:
    items, total = service.list_cdrls_for_program(
        db=db,
        tenant_id=tenant_id,
        program_id=program_id,
    )

    return CdrlListResponse(
        items=[
            CdrlResponse.model_validate(item)
            for item in items
        ],
        total=total,
    )


@router.get(
    "/{cdrl_id}",
    response_model=CdrlResponse,
)
def get_cdrl(
    cdrl_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> CdrlResponse:
    cdrl = service.get_cdrl_for_tenant(
        db=db,
        tenant_id=tenant_id,
        cdrl_id=cdrl_id,
    )

    return CdrlResponse.model_validate(cdrl)


@router.put(
    "/{cdrl_id}",
    response_model=CdrlResponse,
)
def update_cdrl(
    cdrl_id: uuid.UUID,
    payload: CdrlUpdate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> CdrlResponse:
    cdrl = service.update_cdrl(
        db=db,
        tenant_id=tenant_id,
        cdrl_id=cdrl_id,
        data=payload,
    )

    return CdrlResponse.model_validate(cdrl)


@router.delete(
    "/{cdrl_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_cdrl(
    cdrl_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> None:
    service.delete_cdrl(
        db=db,
        tenant_id=tenant_id,
        cdrl_id=cdrl_id,
    )