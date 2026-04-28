import uuid
from datetime import date, datetime, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document_revision import DocumentRevision
from app.repositories.document import DocumentRepository
from app.repositories.document_approval import DocumentApprovalRepository
from app.repositories.document_revision import DocumentRevisionRepository
from app.schemas.document_revision import DocumentRevisionCreate


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentRevisionService:
    def __init__(self) -> None:
        self.document_repository = DocumentRepository()
        self.revision_repository = DocumentRevisionRepository()
        self.approval_repository = DocumentApprovalRepository()

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

    def submit_for_review(
        self,
        db: Session,
        revision_id: uuid.UUID,
    ) -> DocumentRevision:
        revision = self.get_revision(db=db, revision_id=revision_id)

        if revision.status != "draft":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only draft revisions can be submitted for review.",
            )

        approvals = self.approval_repository.list_by_revision_id(
            db=db,
            revision_id=revision_id,
        )

        if not approvals:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot submit revision without approval records.",
            )

        revision.status = "in_review"
        revision.submitted_for_approval_at = utc_now()

        db.add(revision)
        db.commit()
        db.refresh(revision)

        return revision

    def evaluate_approval_state(
        self,
        db: Session,
        revision_id: uuid.UUID,
    ) -> DocumentRevision:
        revision = self.get_revision(db=db, revision_id=revision_id)

        approvals = self.approval_repository.list_by_revision_id(
            db=db,
            revision_id=revision_id,
        )

        if not approvals:
            return revision

        statuses = [approval.status for approval in approvals]

        if any(status_value == "rejected" for status_value in statuses):
            revision.status = "rejected"

        elif all(status_value == "approved" for status_value in statuses):
            revision.status = "approved"
            revision.approved_at = utc_now()

        db.add(revision)
        db.commit()
        db.refresh(revision)

        return revision

    def make_effective(
        self,
        db: Session,
        revision_id: uuid.UUID,
    ) -> DocumentRevision:
        revision = self.get_revision(db=db, revision_id=revision_id)

        if revision.status != "approved":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only approved revisions can be made effective.",
            )

        document = self.document_repository.get_by_id(
            db=db,
            document_id=revision.document_id,
        )
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent document not found.",
            )

        previous_effective_revision = self.revision_repository.get_effective_revision_for_document(
            db=db,
            document_id=revision.document_id,
        )

        today = date.today()

        if previous_effective_revision and previous_effective_revision.id != revision.id:
            previous_effective_revision.status = "obsolete"
            previous_effective_revision.is_current = False
            previous_effective_revision.is_effective = False
            previous_effective_revision.obsolete_date = today
            db.add(previous_effective_revision)

        revision.status = "effective"
        revision.is_current = True
        revision.is_effective = True
        revision.effective_date = today
        revision.obsolete_date = None

        document.status = "active"
        document.current_revision_id = revision.id

        db.add(revision)
        db.add(document)
        db.commit()
        db.refresh(revision)

        return revision