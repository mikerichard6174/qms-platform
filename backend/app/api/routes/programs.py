import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.schemas.program import (
    ProgramCreate,
    ProgramListResponse,
    ProgramResponse,
    ProgramUpdate,
)
from app.services.program_service import ProgramService

router = APIRouter(prefix="/programs", tags=["programs"])

service = ProgramService()


@router.post(
    "",
    response_model=ProgramResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_program(
    payload: ProgramCreate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> ProgramResponse:
    payload.tenant_id = tenant_id

    program = service.create_program(
        db=db,
        data=payload,
    )

    return ProgramResponse.model_validate(program)


@router.get("", response_model=ProgramListResponse)
def list_programs(
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> ProgramListResponse:
    items, total = service.list_programs_for_tenant(
        db=db,
        tenant_id=tenant_id,
    )

    return ProgramListResponse(
        items=[ProgramResponse.model_validate(item) for item in items],
        total=total,
    )


@router.get("/{program_id}", response_model=ProgramResponse)
def get_program(
    program_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> ProgramResponse:
    program = service.get_program_for_tenant(
        db=db,
        tenant_id=tenant_id,
        program_id=program_id,
    )

    return ProgramResponse.model_validate(program)


@router.put("/{program_id}", response_model=ProgramResponse)
def update_program(
    program_id: uuid.UUID,
    payload: ProgramUpdate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> ProgramResponse:
    updated_program = service.update_program(
        db=db,
        tenant_id=tenant_id,
        program_id=program_id,
        data=payload,
    )

    return ProgramResponse.model_validate(updated_program)