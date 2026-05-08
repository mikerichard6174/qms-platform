import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.api.deps.user_context import require_user_id_header
from app.schemas.document_approval import (
    DocumentApprovalAction,
    DocumentApprovalCreate,
    DocumentApprovalListResponse,
    DocumentApprovalResponse,
)
from app.services.document_approval_service import DocumentApprovalService

router = APIRouter(prefix="/document-approvals", tags=["document-approvals"])

service = DocumentApprovalService()


@router.post("", response_model=DocumentApprovalResponse, status_code=status.HTTP_201_CREATED)
def create_document_approval(
    payload: DocumentApprovalCreate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> DocumentApprovalResponse:
    payload.tenant_id = tenant_id

    if not payload.approver_user_id:
        payload.approver_user_id = user_id

    approval = service.create_approval_for_tenant(
        db=db,
        tenant_id=tenant_id,
        actor_user_id=user_id,
        data=payload,
    )
    return DocumentApprovalResponse.model_validate(approval)


@router.get("/{approval_id}", response_model=DocumentApprovalResponse)
def get_document_approval(
    approval_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> DocumentApprovalResponse:
    approval = service.get_approval_for_tenant(
        db=db,
        tenant_id=tenant_id,
        approval_id=approval_id,
    )
    return DocumentApprovalResponse.model_validate(approval)


@router.get("/by-revision/{revision_id}", response_model=DocumentApprovalListResponse)
def list_document_approvals_for_revision(
    revision_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> DocumentApprovalListResponse:
    items, total = service.list_approvals_for_tenant_and_revision(
        db=db,
        tenant_id=tenant_id,
        revision_id=revision_id,
    )
    return DocumentApprovalListResponse(
        items=[DocumentApprovalResponse.model_validate(item) for item in items],
        total=total,
    )


@router.post("/{approval_id}/approve", response_model=DocumentApprovalResponse)
def approve_document_approval(
    approval_id: uuid.UUID,
    payload: DocumentApprovalAction,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> DocumentApprovalResponse:
    approval = service.approve_for_tenant(
        db=db,
        tenant_id=tenant_id,
        user_id=user_id,
        approval_id=approval_id,
        comment=payload.comment,
    )
    return DocumentApprovalResponse.model_validate(approval)


@router.post("/{approval_id}/reject", response_model=DocumentApprovalResponse)
def reject_document_approval(
    approval_id: uuid.UUID,
    payload: DocumentApprovalAction,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> DocumentApprovalResponse:
    approval = service.reject_for_tenant(
        db=db,
        tenant_id=tenant_id,
        user_id=user_id,
        approval_id=approval_id,
        comment=payload.comment,
    )
    return DocumentApprovalResponse.model_validate(approval)