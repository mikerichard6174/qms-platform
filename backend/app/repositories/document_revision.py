import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_revision import DocumentRevision
from app.schemas.document_revision import DocumentRevisionCreate


class DocumentRevisionRepository:
    def create(self, db: Session, data: DocumentRevisionCreate) -> DocumentRevision:
        revision = DocumentRevision(
            document_id=data.document_id,
            tenant_id=data.tenant_id,
            revision_label=data.revision_label,
            revision_number=data.revision_number,
            change_summary=data.change_summary,
            file_id=data.file_id,
            status=data.status,
            is_current=data.is_current,
            is_effective=data.is_effective,
            effective_date=data.effective_date,
            obsolete_date=data.obsolete_date,
            approved_by_user_id=data.approved_by_user_id,
            created_by_user_id=data.created_by_user_id,
            updated_by_user_id=data.updated_by_user_id,
        )
        db.add(revision)
        db.commit()
        db.refresh(revision)
        return revision

    def save(self, db: Session, revision: DocumentRevision) -> DocumentRevision:
        db.add(revision)
        db.commit()
        db.refresh(revision)
        return revision

    def get_by_id(self, db: Session, revision_id: uuid.UUID) -> DocumentRevision | None:
        stmt = select(DocumentRevision).where(DocumentRevision.id == revision_id)
        return db.scalar(stmt)

    def list_by_document_id(self, db: Session, document_id: uuid.UUID) -> list[DocumentRevision]:
        stmt = (
            select(DocumentRevision)
            .where(DocumentRevision.document_id == document_id)
            .order_by(DocumentRevision.created_at.desc())
        )
        return list(db.scalars(stmt).all())

    def get_by_document_and_label(
        self,
        db: Session,
        document_id: uuid.UUID,
        revision_label: str,
    ) -> DocumentRevision | None:
        stmt = select(DocumentRevision).where(
            DocumentRevision.document_id == document_id,
            DocumentRevision.revision_label == revision_label,
        )
        return db.scalar(stmt)

    def get_effective_revision_for_document(
        self,
        db: Session,
        document_id: uuid.UUID,
    ) -> DocumentRevision | None:
        stmt = select(DocumentRevision).where(
            DocumentRevision.document_id == document_id,
            DocumentRevision.is_effective.is_(True),
        )
        return db.scalar(stmt)