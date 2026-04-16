import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
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
    db: Session = Depends(get_db),
) -> DocumentApprovalResponse:
    approval = service.create_approval(db=db, data=payload)
    return DocumentApprovalResponse.model_validate(approval)


@router.get("/{approval_id}", response_model=DocumentApprovalResponse)
def get_document_approval(
    approval_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> DocumentApprovalResponse:
    approval = service.get_approval(db=db, approval_id=approval_id)
    return DocumentApprovalResponse.model_validate(approval)


@router.get("/by-revision/{revision_id}", response_model=DocumentApprovalListResponse)
def list_document_approvals_for_revision(
    revision_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> DocumentApprovalListResponse:
    items, total = service.list_approvals_for_revision(db=db, revision_id=revision_id)
    return DocumentApprovalListResponse(
        items=[DocumentApprovalResponse.model_validate(item) for item in items],
        total=total,
    )


@router.post("/{approval_id}/approve", response_model=DocumentApprovalResponse)
def approve_document_approval(
    approval_id: uuid.UUID,
    payload: DocumentApprovalAction,
    db: Session = Depends(get_db),
) -> DocumentApprovalResponse:
    approval = service.approve(db=db, approval_id=approval_id, comment=payload.comment)
    return DocumentApprovalResponse.model_validate(approval)


@router.post("/{approval_id}/reject", response_model=DocumentApprovalResponse)
def reject_document_approval(
    approval_id: uuid.UUID,
    payload: DocumentApprovalAction,
    db: Session = Depends(get_db),
) -> DocumentApprovalResponse:
    approval = service.reject(db=db, approval_id=approval_id, comment=payload.comment)
    return DocumentApprovalResponse.model_validate(approval)