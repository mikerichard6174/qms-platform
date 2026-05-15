import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.schemas.user_program_assignment import (
    UserProgramAssignmentCreate,
    UserProgramAssignmentListResponse,
    UserProgramAssignmentResponse,
)
from app.services.user_program_assignment_service import (
    UserProgramAssignmentService,
)

router = APIRouter(
    prefix="/user-program-assignments",
    tags=["user-program-assignments"],
)

service = UserProgramAssignmentService()


@router.post(
    "",
    response_model=UserProgramAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_assignment(
    payload: UserProgramAssignmentCreate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> UserProgramAssignmentResponse:
    payload.tenant_id = tenant_id

    assignment = service.assign_user_to_program(
        db=db,
        data=payload,
    )

    return UserProgramAssignmentResponse.model_validate(
        assignment,
    )


@router.get(
    "/by-user/{user_id}",
    response_model=UserProgramAssignmentListResponse,
)
def list_assignments_for_user(
    user_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> UserProgramAssignmentListResponse:
    items, total = service.list_assignments_for_user(
        db=db,
        tenant_id=tenant_id,
        user_id=user_id,
    )

    return UserProgramAssignmentListResponse(
        items=[
            UserProgramAssignmentResponse.model_validate(item)
            for item in items
        ],
        total=total,
    )