import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.api.deps.user_context import require_user_id_header
from app.schemas.document import (
    DocumentListResponse,
    DocumentProgramAssignmentUpdate,
    DocumentResponse,
)
from app.services.document_service import DocumentService

router = APIRouter(prefix="/admin/documents", tags=["admin-documents"])

service = DocumentService()


@router.get("/unassigned", response_model=DocumentListResponse)
def list_unassigned_documents(
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    db: Session = Depends(get_db),
) -> DocumentListResponse:
    items, total = service.list_unassigned_documents_for_tenant(
        db=db,
        tenant_id=tenant_id,
    )

    return DocumentListResponse(
        items=[DocumentResponse.model_validate(item) for item in items],
        total=total,
    )


@router.put("/{document_id}/program", response_model=DocumentResponse)
def assign_document_to_program(
    document_id: uuid.UUID,
    payload: DocumentProgramAssignmentUpdate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    document = service.assign_document_to_program(
        db=db,
        tenant_id=tenant_id,
        actor_user_id=user_id,
        document_id=document_id,
        program_id=payload.program_id,
    )

    return DocumentResponse.model_validate(document)