import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.api.deps.user_context import require_user_id_header
from app.schemas.standard_clause import (
    StandardClauseCreate,
    StandardClauseListResponse,
    StandardClauseResponse,
    StandardClauseUpdate,
)
from app.services.standard_clause_service import StandardClauseService

router = APIRouter(
    prefix="/standard-clauses",
    tags=["standard-clauses"],
)

service = StandardClauseService()


@router.post(
    "",
    response_model=StandardClauseResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_standard_clause(
    payload: StandardClauseCreate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> StandardClauseResponse:
    payload.tenant_id = tenant_id

    clause = service.create_clause(
        db=db,
        data=payload,
        actor_user_id=user_id,
    )

    return StandardClauseResponse.model_validate(clause)


@router.get(
    "/by-standard/{standard_id}",
    response_model=StandardClauseListResponse,
)
def list_standard_clauses(
    standard_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> StandardClauseListResponse:
    items, total = service.list_clauses_for_standard(
        db=db,
        tenant_id=tenant_id,
        standard_id=standard_id,
    )

    return StandardClauseListResponse(
        items=[
            StandardClauseResponse.model_validate(item)
            for item in items
        ],
        total=total,
    )


@router.get(
    "/{clause_id}",
    response_model=StandardClauseResponse,
)
def get_standard_clause(
    clause_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> StandardClauseResponse:
    clause = service.get_clause_for_tenant(
        db=db,
        tenant_id=tenant_id,
        clause_id=clause_id,
    )

    return StandardClauseResponse.model_validate(clause)


@router.put(
    "/{clause_id}",
    response_model=StandardClauseResponse,
)
def update_standard_clause(
    clause_id: uuid.UUID,
    payload: StandardClauseUpdate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> StandardClauseResponse:
    clause = service.update_clause(
        db=db,
        tenant_id=tenant_id,
        clause_id=clause_id,
        data=payload,
        actor_user_id=user_id,
    )

    return StandardClauseResponse.model_validate(clause)