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

    # -------------------------
    # CREATE
    # -------------------------

    def create_approval(
        self,
        db: Session,
        data: DocumentApprovalCreate,
    ) -> DocumentApproval:
        revision = self.revision_repository.get_by_id(
            db=db,
            revision_id=data.document_revision_id,
        )
        if not revision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent document revision not found.",
            )

        return self._create_core(db=db, data=data, actor_user_id=None)

    def create_approval_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        actor_user_id: uuid.UUID,
        data: DocumentApprovalCreate,
    ) -> DocumentApproval:
        revision = self.revision_repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            revision_id=data.document_revision_id,
        )
        if not revision:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent document revision not found for tenant.",
            )

        return self._create_core(
            db=db,
            data=data,
            actor_user_id=actor_user_id,
        )

    def _create_core(
        self,
        db: Session,
        data: DocumentApprovalCreate,
        actor_user_id: uuid.UUID | None,
    ) -> DocumentApproval:
        existing_items = self.approval_repository.list_by_tenant_and_revision_id(
            db=db,
            tenant_id=data.tenant_id,
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
                actor_user_id=actor_user_id,
                entity_type="document_approval",
                entity_id=approval.id,
                action="assigned",
                summary="Approval was assigned.",
                old_values_json=None,
                new_values_json={
                    "document_revision_id": str(approval.document_revision_id),
                    "approver_user_id": str(approval.approver_user_id),
                    "status": approval.status,
                },
                metadata_json={
                    "source": "document_approval_service.create",
                },
            ),
        )

        return approval

    # -------------------------
    # READ
    # -------------------------

    def get_approval(
        self,
        db: Session,
        approval_id: uuid.UUID,
    ) -> DocumentApproval:
        approval = self.approval_repository.get_by_id(
            db=db,
            approval_id=approval_id,
        )
        if not approval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document approval not found.",
            )
        return approval

    def get_approval_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        approval_id: uuid.UUID,
    ) -> DocumentApproval:
        approval = self.approval_repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            approval_id=approval_id,
        )
        if not approval:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document approval not found for tenant.",
            )
        return approval

    def list_approvals_for_revision(
        self,
        db: Session,
        revision_id: uuid.UUID,
    ) -> tuple[list[DocumentApproval], int]:
        items = self.approval_repository.list_by_revision_id(
            db=db,
            revision_id=revision_id,
        )
        return items, len(items)

    def list_approvals_for_tenant_and_revision(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        revision_id: uuid.UUID,
    ) -> tuple[list[DocumentApproval], int]:
        items = self.approval_repository.list_by_tenant_and_revision_id(
            db=db,
            tenant_id=tenant_id,
            revision_id=revision_id,
        )
        return items, len(items)

    # -------------------------
    # ACTIONS
    # -------------------------

    def approve(
        self,
        db: Session,
        approval_id: uuid.UUID,
        comment: str | None = None,
    ) -> DocumentApproval:
        approval = self.get_approval(db=db, approval_id=approval_id)
        return self._approve_core(db=db, approval=approval, user_id=approval.approver_user_id, comment=comment)

    def approve_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        approval_id: uuid.UUID,
        comment: str | None = None,
    ) -> DocumentApproval:
        approval = self.get_approval_for_tenant(
            db=db,
            tenant_id=tenant_id,
            approval_id=approval_id,
        )

        if approval.approver_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the assigned approver.",
            )

        return self._approve_core(db=db, approval=approval, user_id=user_id, comment=comment)

    def _approve_core(
        self,
        db: Session,
        approval: DocumentApproval,
        user_id: uuid.UUID,
        comment: str | None,
    ) -> DocumentApproval:
        if approval.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending approvals can be approved.",
            )

        updated = self.approval_repository.mark_approved(
            db=db,
            approval=approval,
            comment=comment,
        )

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=updated.tenant_id,
                actor_user_id=user_id,
                entity_type="document_approval",
                entity_id=updated.id,
                action="approved",
                summary="Approval approved.",
                old_values_json={"status": "pending"},
                new_values_json={"status": updated.status},
                metadata_json={"source": "document_approval_service.approve"},
            ),
        )

        self._evaluate_parent_revision(db=db, revision_id=updated.document_revision_id)

        return updated

    def reject(
        self,
        db: Session,
        approval_id: uuid.UUID,
        comment: str | None = None,
    ) -> DocumentApproval:
        approval = self.get_approval(db=db, approval_id=approval_id)
        return self._reject_core(db=db, approval=approval, user_id=approval.approver_user_id, comment=comment)

    def reject_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        approval_id: uuid.UUID,
        comment: str | None = None,
    ) -> DocumentApproval:
        approval = self.get_approval_for_tenant(
            db=db,
            tenant_id=tenant_id,
            approval_id=approval_id,
        )

        if approval.approver_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not the assigned approver.",
            )

        return self._reject_core(db=db, approval=approval, user_id=user_id, comment=comment)

    def _reject_core(
        self,
        db: Session,
        approval: DocumentApproval,
        user_id: uuid.UUID,
        comment: str | None,
    ) -> DocumentApproval:
        if approval.status != "pending":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only pending approvals can be rejected.",
            )

        updated = self.approval_repository.mark_rejected(
            db=db,
            approval=approval,
            comment=comment,
        )

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=updated.tenant_id,
                actor_user_id=user_id,
                entity_type="document_approval",
                entity_id=updated.id,
                action="rejected",
                summary="Approval rejected.",
                old_values_json={"status": "pending"},
                new_values_json={"status": updated.status},
                metadata_json={"source": "document_approval_service.reject"},
            ),
        )

        self._evaluate_parent_revision(db=db, revision_id=updated.document_revision_id)

        return updated

    def _evaluate_parent_revision(self, db: Session, revision_id: uuid.UUID) -> None:
        from app.services.document_revision_service import DocumentRevisionService

        revision_service = DocumentRevisionService()
        revision_service.evaluate_approval_state(db=db, revision_id=revision_id)