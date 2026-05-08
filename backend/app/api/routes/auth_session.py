import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.api.deps.user_context import require_user_id_header
from app.schemas.auth_session import AuthSessionResponse
from app.services.auth_session_service import AuthSessionService

router = APIRouter(prefix="/auth/session", tags=["auth"])

service = AuthSessionService()


@router.get("", response_model=AuthSessionResponse)
def get_auth_session(
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> AuthSessionResponse:
    return service.get_session(
        db=db,
        tenant_id=tenant_id,
        user_id=user_id,
    )