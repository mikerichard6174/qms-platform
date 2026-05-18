import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.api.deps.user_context import require_user_id_header
from app.schemas.program_standard_mapping import (
    ProgramStandardMappingCreate,
    ProgramStandardMappingListResponse,
    ProgramStandardMappingResponse,
    ProgramStandardMappingUpdate,
)
from app.services.program_standard_mapping_service import (
    ProgramStandardMappingService,
)

router = APIRouter(
    prefix="/program-standard-mappings",
    tags=["program-standard-mappings"],
)

service = ProgramStandardMappingService()


@router.post(
    "",
    response_model=ProgramStandardMappingResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_program_standard_mapping(
    payload: ProgramStandardMappingCreate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> ProgramStandardMappingResponse:
    payload.tenant_id = tenant_id

    mapping = service.create_mapping(
        db=db,
        data=payload,
        actor_user_id=user_id,
    )

    return ProgramStandardMappingResponse.model_validate(mapping)


@router.get(
    "/by-program/{program_id}",
    response_model=ProgramStandardMappingListResponse,
)
def list_program_standard_mappings(
    program_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> ProgramStandardMappingListResponse:
    items, total = service.list_mappings_for_program(
        db=db,
        tenant_id=tenant_id,
        program_id=program_id,
    )

    return ProgramStandardMappingListResponse(
        items=[
            ProgramStandardMappingResponse.model_validate(item)
            for item in items
        ],
        total=total,
    )


@router.get(
    "/{mapping_id}",
    response_model=ProgramStandardMappingResponse,
)
def get_program_standard_mapping(
    mapping_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> ProgramStandardMappingResponse:
    mapping = service.get_mapping_for_tenant(
        db=db,
        tenant_id=tenant_id,
        mapping_id=mapping_id,
    )

    return ProgramStandardMappingResponse.model_validate(mapping)


@router.put(
    "/{mapping_id}",
    response_model=ProgramStandardMappingResponse,
)
def update_program_standard_mapping(
    mapping_id: uuid.UUID,
    payload: ProgramStandardMappingUpdate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> ProgramStandardMappingResponse:
    mapping = service.update_mapping(
        db=db,
        tenant_id=tenant_id,
        mapping_id=mapping_id,
        data=payload,
        actor_user_id=user_id,
    )

    return ProgramStandardMappingResponse.model_validate(mapping)