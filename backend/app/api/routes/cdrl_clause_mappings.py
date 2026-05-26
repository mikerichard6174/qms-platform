import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.schemas.cdrl_clause_mapping import (
    CdrlClauseMappingCreate,
    CdrlClauseMappingListResponse,
    CdrlClauseMappingResponse,
    CdrlClauseMappingUpdate,
)
from app.services.cdrl_clause_mapping_service import CdrlClauseMappingService

router = APIRouter(
    prefix="/cdrl-clause-mappings",
    tags=["cdrl-clause-mappings"],
)

service = CdrlClauseMappingService()


@router.post(
    "",
    response_model=CdrlClauseMappingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_cdrl_clause_mapping(
    payload: CdrlClauseMappingCreate,
    db: Session = Depends(get_db),
) -> CdrlClauseMappingResponse:
    mapping = service.create_mapping(
        db=db,
        data=payload,
    )

    return CdrlClauseMappingResponse.model_validate(mapping)


@router.get(
    "/by-cdrl/{cdrl_id}",
    response_model=CdrlClauseMappingListResponse,
)
def list_cdrl_clause_mappings(
    cdrl_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> CdrlClauseMappingListResponse:
    items, total = service.list_mappings_for_cdrl(
        db=db,
        tenant_id=tenant_id,
        cdrl_id=cdrl_id,
    )

    return CdrlClauseMappingListResponse(
        items=[
            CdrlClauseMappingResponse.model_validate(item)
            for item in items
        ],
        total=total,
    )


@router.get(
    "/{mapping_id}",
    response_model=CdrlClauseMappingResponse,
)
def get_cdrl_clause_mapping(
    mapping_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> CdrlClauseMappingResponse:
    mapping = service.get_mapping_for_tenant(
        db=db,
        tenant_id=tenant_id,
        mapping_id=mapping_id,
    )

    return CdrlClauseMappingResponse.model_validate(mapping)


@router.put(
    "/{mapping_id}",
    response_model=CdrlClauseMappingResponse,
)
def update_cdrl_clause_mapping(
    mapping_id: uuid.UUID,
    payload: CdrlClauseMappingUpdate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> CdrlClauseMappingResponse:
    mapping = service.update_mapping(
        db=db,
        tenant_id=tenant_id,
        mapping_id=mapping_id,
        data=payload,
    )

    return CdrlClauseMappingResponse.model_validate(mapping)


@router.delete(
    "/{mapping_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_cdrl_clause_mapping(
    mapping_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> None:
    service.delete_mapping(
        db=db,
        tenant_id=tenant_id,
        mapping_id=mapping_id,
    )