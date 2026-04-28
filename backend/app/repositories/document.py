import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.schemas.document import DocumentCreate


class DocumentRepository:
    def create(self, db: Session, data: DocumentCreate) -> Document:
        document = Document(
            tenant_id=data.tenant_id,
            program_id=data.program_id,
            document_number=data.document_number,
            title=data.title,
            document_type=data.document_type,
            owner_user_id=data.owner_user_id,
            status=data.status,
            is_controlled=data.is_controlled,
            review_due_date=data.review_due_date,
            metadata_json=data.metadata_json,
            created_by_user_id=data.created_by_user_id,
            updated_by_user_id=data.updated_by_user_id,
        )
        db.add(document)
        db.commit()
        db.refresh(document)
        return document

    def save(self, db: Session, document: Document) -> Document:
        db.add(document)
        db.commit()
        db.refresh(document)
        return document

    def get_by_id(self, db: Session, document_id: uuid.UUID) -> Document | None:
        stmt = select(Document).where(Document.id == document_id)
        return db.scalar(stmt)

    def list_all(self, db: Session) -> list[Document]:
        stmt = select(Document).order_by(Document.created_at.desc())
        return list(db.scalars(stmt).all())

    def get_by_document_number(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        document_number: str,
    ) -> Document | None:
        stmt = select(Document).where(
            Document.tenant_id == tenant_id,
            Document.document_number == document_number,
        )
        return db.scalar(stmt)