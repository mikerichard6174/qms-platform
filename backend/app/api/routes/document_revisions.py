import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.schemas.document_revision import (
    DocumentRevisionCreate,
    DocumentRevisionListResponse,
    DocumentRevisionResponse,
)
from app.services.document_revision_service import DocumentRevisionService

router = APIRouter(prefix="/document-revisions", tags=["document-revisions"])

service = DocumentRevisionService()


@router.post("", response_model=DocumentRevisionResponse, status_code=status.HTTP_201_CREATED)
def create_document_revision(
    payload: DocumentRevisionCreate,
    db: Session = Depends(get_db),
) -> DocumentRevisionResponse:
    revision = service.create_revision(db=db, data=payload)
    return DocumentRevisionResponse.model_validate(revision)


@router.get("/{revision_id}", response_model=DocumentRevisionResponse)
def get_document_revision(
    revision_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> DocumentRevisionResponse:
    revision = service.get_revision(db=db, revision_id=revision_id)
    return DocumentRevisionResponse.model_validate(revision)


@router.get("/by-document/{document_id}", response_model=DocumentRevisionListResponse)
def list_document_revisions_for_document(
    document_id: uuid.UUID,
    db: Session = Depends(get_db),
) -> DocumentRevisionListResponse:
    items, total = service.list_revisions_for_document(db=db, document_id=document_id)
    return DocumentRevisionListResponse(
        items=[DocumentRevisionResponse.model_validate(item) for item in items],
        total=total,
    )