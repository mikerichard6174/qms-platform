import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document_approval import DocumentApproval
from app.repositories.document_approval import DocumentApprovalRepository
from app.repositories.document_revision import DocumentRevisionRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.document_approval import DocumentApprovalCreate
from app.services.audit_event_service import AuditEventService


class DocumentApprovalService:
    def __init__(self) -> None:
        self.approval_repository = DocumentApprovalRepository()
        self.revision_repository = DocumentRevisionRepository()
        self.audit_service = AuditEventService()

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

        approval = self.approval_repository.create(db=db, data=data)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=approval.tenant_id,
                actor_user_id=None,
                entity_type="document_approval",
                entity_id=approval.id,
                action="assigned",
                summary=f"Approval was assigned for revision {revision.revision_label}.",
                old_values_json=None,
                new_values_json={
                    "document_revision_id": str(approval.document_revision_id),
                    "approver_user_id": str(approval.approver_user_id),
                    "approval_type": approval.approval_type,
                    "status": approval.status,
                    "comment": approval.comment,
                },
                metadata_json={
                    "source": "document_approval_service.create_approval",
                    "document_id": str(revision.document_id),
                    "revision_label": revision.revision_label,
                },
            ),
        )

        return approval

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

        old_status = approval.status
        old_comment = approval.comment
        old_acted_at = approval.acted_at

        updated_approval = self.approval_repository.mark_approved(
            db=db,
            approval=approval,
            comment=comment,
        )

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=updated_approval.tenant_id,
                actor_user_id=updated_approval.approver_user_id,
                entity_type="document_approval",
                entity_id=updated_approval.id,
                action="approved",
                summary="Approval record was approved.",
                old_values_json={
                    "status": old_status,
                    "comment": old_comment,
                    "acted_at": old_acted_at.isoformat() if old_acted_at else None,
                },
                new_values_json={
                    "status": updated_approval.status,
                    "comment": updated_approval.comment,
                    "acted_at": updated_approval.acted_at.isoformat()
                    if updated_approval.acted_at
                    else None,
                },
                metadata_json={
                    "source": "document_approval_service.approve",
                    "document_revision_id": str(updated_approval.document_revision_id),
                },
            ),
        )

        self._evaluate_parent_revision(db=db, revision_id=updated_approval.document_revision_id)

        return updated_approval

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

        old_status = approval.status
        old_comment = approval.comment
        old_acted_at = approval.acted_at

        updated_approval = self.approval_repository.mark_rejected(
            db=db,
            approval=approval,
            comment=comment,
        )

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=updated_approval.tenant_id,
                actor_user_id=updated_approval.approver_user_id,
                entity_type="document_approval",
                entity_id=updated_approval.id,
                action="rejected",
                summary="Approval record was rejected.",
                old_values_json={
                    "status": old_status,
                    "comment": old_comment,
                    "acted_at": old_acted_at.isoformat() if old_acted_at else None,
                },
                new_values_json={
                    "status": updated_approval.status,
                    "comment": updated_approval.comment,
                    "acted_at": updated_approval.acted_at.isoformat()
                    if updated_approval.acted_at
                    else None,
                },
                metadata_json={
                    "source": "document_approval_service.reject",
                    "document_revision_id": str(updated_approval.document_revision_id),
                },
            ),
        )

        self._evaluate_parent_revision(db=db, revision_id=updated_approval.document_revision_id)

        return updated_approval

    def _evaluate_parent_revision(self, db: Session, revision_id: uuid.UUID) -> None:
        from app.services.document_revision_service import DocumentRevisionService

        revision_service = DocumentRevisionService()
        revision_service.evaluate_approval_state(db=db, revision_id=revision_id)