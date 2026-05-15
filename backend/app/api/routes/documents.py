import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.api.deps.tenant_context import require_tenant_id_header
from app.api.deps.user_context import require_user_id_header
from app.schemas.document import DocumentCreate, DocumentListResponse, DocumentResponse
from app.services.document_service import DocumentService

router = APIRouter(prefix="/documents", tags=["documents"])

service = DocumentService()


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreate,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    payload.tenant_id = tenant_id
    payload.created_by_user_id = user_id
    payload.updated_by_user_id = user_id

    if not payload.owner_user_id:
        payload.owner_user_id = user_id

    document = service.create_document(db=db, data=payload)
    return DocumentResponse.model_validate(document)


@router.get("", response_model=DocumentListResponse)
def list_documents(
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> DocumentListResponse:
    items, total = service.list_documents_for_user_program_access(
        db=db,
        tenant_id=tenant_id,
        user_id=user_id,
    )

    return DocumentListResponse(
        items=[DocumentResponse.model_validate(item) for item in items],
        total=total,
    )


@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(require_tenant_id_header),
    user_id: uuid.UUID = Depends(require_user_id_header),
    db: Session = Depends(get_db),
) -> DocumentResponse:
    document = service.get_document_for_user_program_access(
        db=db,
        tenant_id=tenant_id,
        user_id=user_id,
        document_id=document_id,
    )

    return DocumentResponse.model_validate(document)