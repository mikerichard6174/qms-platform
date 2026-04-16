import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document_approval import DocumentApproval
from app.schemas.document_approval import DocumentApprovalCreate


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentApprovalRepository:
    def create(self, db: Session, data: DocumentApprovalCreate) -> DocumentApproval:
        approval = DocumentApproval(
            document_revision_id=data.document_revision_id,
            tenant_id=data.tenant_id,
            approver_user_id=data.approver_user_id,
            approval_type=data.approval_type,
            status=data.status,
            comment=data.comment,
        )
        db.add(approval)
        db.commit()
        db.refresh(approval)
        return approval

    def get_by_id(self, db: Session, approval_id: uuid.UUID) -> DocumentApproval | None:
        stmt = select(DocumentApproval).where(DocumentApproval.id == approval_id)
        return db.scalar(stmt)

    def list_by_revision_id(self, db: Session, revision_id: uuid.UUID) -> list[DocumentApproval]:
        stmt = (
            select(DocumentApproval)
            .where(DocumentApproval.document_revision_id == revision_id)
            .order_by(DocumentApproval.created_at.asc())
        )
        return list(db.scalars(stmt).all())

    def save(self, db: Session, approval: DocumentApproval) -> DocumentApproval:
        db.add(approval)
        db.commit()
        db.refresh(approval)
        return approval

    def mark_approved(
        self,
        db: Session,
        approval: DocumentApproval,
        comment: str | None = None,
    ) -> DocumentApproval:
        approval.status = "approved"
        approval.comment = comment
        approval.acted_at = utc_now()
        return self.save(db=db, approval=approval)

    def mark_rejected(
        self,
        db: Session,
        approval: DocumentApproval,
        comment: str | None = None,
    ) -> DocumentApproval:
        approval.status = "rejected"
        approval.comment = comment
        approval.acted_at = utc_now()
        return self.save(db=db, approval=approval)