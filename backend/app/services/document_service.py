import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.document import DocumentRepository
from app.schemas.document import DocumentCreate
from app.models.document import Document


class DocumentService:
    def __init__(self) -> None:
        self.repository = DocumentRepository()

    def create_document(self, db: Session, data: DocumentCreate) -> Document:
        existing = self.repository.get_by_document_number(
            db=db,
            tenant_id=data.tenant_id,
            document_number=data.document_number,
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A document with that number already exists for this tenant.",
            )

        return self.repository.create(db=db, data=data)

    def get_document(self, db: Session, document_id: uuid.UUID) -> Document:
        document = self.repository.get_by_id(db=db, document_id=document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )
        return document

    def list_documents(self, db: Session) -> tuple[list[Document], int]:
        items = self.repository.list_all(db=db)
        return items, len(items)