import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document_revision import DocumentRevision
from app.repositories.document import DocumentRepository
from app.repositories.document_revision import DocumentRevisionRepository
from app.schemas.document_revision import DocumentRevisionCreate


class DocumentRevisionService:
    def __init__(self) -> None:
        self.document_repository = DocumentRepository()
        self.revision_repository = DocumentRevisionRepository()

    def create_revision(self, db: Session, data: DocumentRevisionCreate) -> DocumentRevision:
        document = self.document_repository.get_by_id(db=db, document_id=data.document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent document not found.",
            )

        existing = self.revision_repository.get_by_document_and_label(
            db=db,
            document_id=data.document_id,
            revision_label=data.revision_label,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A revision with that label already exists for this document.",
            )

        return self.revision_repository.create(db=db, data=data)

    def get_revision(self, db: Session, revision_id: uuid.UUID) -> DocumentRevision:
        revision = self.revision_repository.get_by_id(db=db, revision_id=revision_id)
        if not revision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document revision not found.",
            )
        return revision

    def list_revisions_for_document(
        self,
        db: Session,
        document_id: uuid.UUID,
    ) -> tuple[list[DocumentRevision], int]:
        document = self.document_repository.get_by_id(db=db, document_id=document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent document not found.",
            )

        items = self.revision_repository.list_by_document_id(db=db, document_id=document_id)
        return items, len(items)