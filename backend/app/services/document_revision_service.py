import uuid
from datetime import date, datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document_revision import DocumentRevision
from app.repositories.document import DocumentRepository
from app.repositories.document_approval import DocumentApprovalRepository
from app.repositories.document_revision import DocumentRevisionRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.document_revision import DocumentRevisionCreate
from app.services.audit_event_service import AuditEventService


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def serialize_value(value: Any) -> Any:
    if isinstance(value, datetime | date):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    return value


class DocumentRevisionService:
    def __init__(self) -> None:
        self.document_repository = DocumentRepository()
        self.revision_repository = DocumentRevisionRepository()
        self.approval_repository = DocumentApprovalRepository()
        self.audit_service = AuditEventService()

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

        revision = self.revision_repository.create(db=db, data=data)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=revision.tenant_id,
                actor_user_id=revision.created_by_user_id,
                entity_type="document_revision",
                entity_id=revision.id,
                action="created",
                summary=f"Revision {revision.revision_label} was created for document {document.document_number}.",
                old_values_json=None,
                new_values_json={
                    "document_id": str(revision.document_id),
                    "revision_label": revision.revision_label,
                    "revision_number": revision.revision_number,
                    "status": revision.status,
                    "external_file_url": revision.external_file_url,
                },
                metadata_json={
                    "source": "document_revision_service.create_revision",
                    "document_id": str(document.id),
                    "document_number": document.document_number,
                },
            ),
        )

        return revision

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

        old_status = revision.status

        revision.status = "in_review"
        revision.submitted_for_approval_at = utc_now()

        db.add(revision)
        db.commit()
        db.refresh(revision)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=revision.tenant_id,
                actor_user_id=revision.updated_by_user_id,
                entity_type="document_revision",
                entity_id=revision.id,
                action="submitted_for_review",
                summary=f"Revision {revision.revision_label} was submitted for review.",
                old_values_json={
                    "status": old_status,
                    "submitted_for_approval_at": None,
                },
                new_values_json={
                    "status": revision.status,
                    "submitted_for_approval_at": serialize_value(
                        revision.submitted_for_approval_at
                    ),
                },
                metadata_json={
                    "source": "document_revision_service.submit_for_review",
                    "approval_count": len(approvals),
                    "document_id": str(revision.document_id),
                },
            ),
        )

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

        old_status = revision.status
        old_approved_at = revision.approved_at

        statuses = [approval.status for approval in approvals]

        if any(status_value == "rejected" for status_value in statuses):
            revision.status = "rejected"

        elif all(status_value == "approved" for status_value in statuses):
            revision.status = "approved"
            revision.approved_at = utc_now()

        if revision.status == old_status and revision.approved_at == old_approved_at:
            return revision

        db.add(revision)
        db.commit()
        db.refresh(revision)

        action = "approval_state_rejected"
        summary = f"Revision {revision.revision_label} was rejected based on approval state."

        if revision.status == "approved":
            action = "approval_state_approved"
            summary = f"Revision {revision.revision_label} was approved based on approval state."

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=revision.tenant_id,
                actor_user_id=revision.updated_by_user_id,
                entity_type="document_revision",
                entity_id=revision.id,
                action=action,
                summary=summary,
                old_values_json={
                    "status": old_status,
                    "approved_at": serialize_value(old_approved_at),
                },
                new_values_json={
                    "status": revision.status,
                    "approved_at": serialize_value(revision.approved_at),
                },
                metadata_json={
                    "source": "document_revision_service.evaluate_approval_state",
                    "approval_statuses": statuses,
                    "document_id": str(revision.document_id),
                },
            ),
        )

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
        previous_revision_audit_data = None

        if previous_effective_revision and previous_effective_revision.id != revision.id:
            previous_revision_audit_data = {
                "id": str(previous_effective_revision.id),
                "revision_label": previous_effective_revision.revision_label,
                "old_status": previous_effective_revision.status,
                "old_is_current": previous_effective_revision.is_current,
                "old_is_effective": previous_effective_revision.is_effective,
            }

            previous_effective_revision.status = "obsolete"
            previous_effective_revision.is_current = False
            previous_effective_revision.is_effective = False
            previous_effective_revision.obsolete_date = today
            db.add(previous_effective_revision)

        old_revision_values = {
            "status": revision.status,
            "is_current": revision.is_current,
            "is_effective": revision.is_effective,
            "effective_date": serialize_value(revision.effective_date),
        }

        old_document_values = {
            "status": document.status,
            "current_revision_id": serialize_value(document.current_revision_id),
        }

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

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=revision.tenant_id,
                actor_user_id=revision.updated_by_user_id,
                entity_type="document_revision",
                entity_id=revision.id,
                action="made_effective",
                summary=f"Revision {revision.revision_label} was made effective.",
                old_values_json=old_revision_values,
                new_values_json={
                    "status": revision.status,
                    "is_current": revision.is_current,
                    "is_effective": revision.is_effective,
                    "effective_date": serialize_value(revision.effective_date),
                },
                metadata_json={
                    "source": "document_revision_service.make_effective",
                    "document_id": str(document.id),
                    "document_number": document.document_number,
                    "previous_effective_revision": previous_revision_audit_data,
                    "document_old_values": old_document_values,
                    "document_new_values": {
                        "status": document.status,
                        "current_revision_id": serialize_value(document.current_revision_id),
                    },
                },
            ),
        )

        if previous_revision_audit_data:
            self.audit_service.create_event(
                db=db,
                data=AuditEventCreate(
                    tenant_id=revision.tenant_id,
                    actor_user_id=revision.updated_by_user_id,
                    entity_type="document_revision",
                    entity_id=uuid.UUID(previous_revision_audit_data["id"]),
                    action="obsoleted",
                    summary=f"Previous revision {previous_revision_audit_data['revision_label']} was obsoleted.",
                    old_values_json={
                        "status": previous_revision_audit_data["old_status"],
                        "is_current": previous_revision_audit_data["old_is_current"],
                        "is_effective": previous_revision_audit_data["old_is_effective"],
                    },
                    new_values_json={
                        "status": "obsolete",
                        "is_current": False,
                        "is_effective": False,
                        "obsolete_date": serialize_value(today),
                    },
                    metadata_json={
                        "source": "document_revision_service.make_effective",
                        "replacement_revision_id": str(revision.id),
                        "document_id": str(document.id),
                    },
                ),
            )

        return revision