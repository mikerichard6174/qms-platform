from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_approval import DocumentApproval
from app.models.document_revision import DocumentRevision


class DashboardRepository:
    def count_documents(self, db: Session) -> int:
        stmt = select(func.count()).select_from(Document)
        return int(db.scalar(stmt) or 0)

    def count_revisions_in_review(self, db: Session) -> int:
        stmt = (
            select(func.count())
            .select_from(DocumentRevision)
            .where(DocumentRevision.status == "in_review")
        )
        return int(db.scalar(stmt) or 0)

    def count_effective_revisions(self, db: Session) -> int:
        stmt = (
            select(func.count())
            .select_from(DocumentRevision)
            .where(DocumentRevision.is_effective.is_(True))
        )
        return int(db.scalar(stmt) or 0)

    def count_pending_approvals(self, db: Session) -> int:
        stmt = (
            select(func.count())
            .select_from(DocumentApproval)
            .where(DocumentApproval.status == "pending")
        )
        return int(db.scalar(stmt) or 0)