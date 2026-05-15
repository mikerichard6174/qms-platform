import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.document import Document
from app.repositories.document import DocumentRepository
from app.repositories.user_program_assignment import (
    UserProgramAssignmentRepository,
)
from app.schemas.audit_event import AuditEventCreate
from app.schemas.document import DocumentCreate
from app.services.audit_event_service import AuditEventService


class DocumentService:
    def __init__(self) -> None:
        self.repository = DocumentRepository()
        self.audit_service = AuditEventService()
        self.user_program_assignment_repository = UserProgramAssignmentRepository()

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

        document = self.repository.create(db=db, data=data)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=document.tenant_id,
                actor_user_id=document.created_by_user_id,
                entity_type="document",
                entity_id=document.id,
                action="created",
                summary=f"Document {document.document_number} was created.",
                old_values_json=None,
                new_values_json={
                    "document_number": document.document_number,
                    "title": document.title,
                    "document_type": document.document_type,
                    "status": document.status,
                    "program_id": str(document.program_id)
                    if document.program_id
                    else None,
                },
                metadata_json={
                    "source": "document_service.create_document",
                    "program_id": str(document.program_id)
                    if document.program_id
                    else None,
                },
            ),
        )

        return document

    def get_document(self, db: Session, document_id: uuid.UUID) -> Document:
        document = self.repository.get_by_id(db=db, document_id=document_id)
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found.",
            )
        return document

    def get_document_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> Document:
        document = self.repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            document_id=document_id,
        )
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found for tenant.",
            )
        return document

    def get_document_for_user_program_access(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
    ) -> Document:
        program_ids = self.user_program_assignment_repository.list_program_ids_for_user(
            db=db,
            tenant_id=tenant_id,
            user_id=user_id,
        )

        if not program_ids:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User has no assigned programs.",
            )

        document = self.repository.get_by_tenant_id_and_program_ids(
            db=db,
            tenant_id=tenant_id,
            document_id=document_id,
            program_ids=program_ids,
        )

        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found for assigned programs.",
            )

        return document

    def list_documents(self, db: Session) -> tuple[list[Document], int]:
        items = self.repository.list_all(db=db)
        return items, len(items)

    def list_documents_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
    ) -> tuple[list[Document], int]:
        items = self.repository.list_by_tenant(
            db=db,
            tenant_id=tenant_id,
        )
        return items, len(items)

    def list_documents_for_user_program_access(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> tuple[list[Document], int]:
        program_ids = self.user_program_assignment_repository.list_program_ids_for_user(
            db=db,
            tenant_id=tenant_id,
            user_id=user_id,
        )

        if not program_ids:
            return [], 0

        items = self.repository.list_by_tenant_and_program_ids(
            db=db,
            tenant_id=tenant_id,
            program_ids=program_ids,
        )

        return items, len(items)