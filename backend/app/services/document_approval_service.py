import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document_approval import DocumentApproval
from app.repositories.document_approval import DocumentApprovalRepository
from app.repositories.document_revision import DocumentRevisionRepository
from app.schemas.document_approval import DocumentApprovalCreate


class DocumentApprovalService:
    def __init__(self) -> None:
        self.approval_repository = DocumentApprovalRepository()
        self.revision_repository = DocumentRevisionRepository()

    def create_approval(self, db: Session, data: DocumentApprovalCreate) -> DocumentApproval:
        revision = self.revision_repository.get_by_id(db=db, revision_id=data.document_revision_id)
        if not revision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent document revision not found.",
            )

        existing_items = self.approval_repository.list_by_revision_id(
            db=db,
            revision_id=data.document_revision_id,
        )
        for item in existing_items:
            if item.approver_user_id == data.approver_user_id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="That approver already has an approval record for this revision.",
                )

        return self.approval_repository.create(db=db, data=data)

    def get_approval(self, db: Session, approval_id: uuid.UUID) -> DocumentApproval:
        approval = self.approval_repository.get_by_id(db=db, approval_id=approval_id)
        if not approval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document approval not found.",
            )
        return approval

    def list_approvals_for_revision(
        self,
        db: Session,
        revision_id: uuid.UUID,
    ) -> tuple[list[DocumentApproval], int]:
        revision = self.revision_repository.get_by_id(db=db, revision_id=revision_id)
        if not revision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent document revision not found.",
            )

        items = self.approval_repository.list_by_revision_id(db=db, revision_id=revision_id)
        return items, len(items)

    def approve(
        self,
        db: Session,
        approval_id: uuid.UUID,
        comment: str | None = None,
    ) -> DocumentApproval:
        approval = self.get_approval(db=db, approval_id=approval_id)
        if approval.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending approvals can be approved.",
            )

        return self.approval_repository.mark_approved(db=db, approval=approval, comment=comment)

    def reject(
        self,
        db: Session,
        approval_id: uuid.UUID,
        comment: str | None = None,
    ) -> DocumentApproval:
        approval = self.get_approval(db=db, approval_id=approval_id)
        if approval.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending approvals can be rejected.",
            )

        return self.approval_repository.mark_rejected(db=db, approval=approval, comment=comment)