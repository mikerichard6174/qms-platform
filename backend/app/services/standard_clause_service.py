import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.standard_clause import StandardClause
from app.repositories.standard import StandardRepository
from app.repositories.standard_clause import StandardClauseRepository
from app.schemas.audit_event import AuditEventCreate
from app.schemas.standard_clause import StandardClauseCreate, StandardClauseUpdate
from app.services.audit_event_service import AuditEventService


class StandardClauseService:
    def __init__(self) -> None:
        self.repository = StandardClauseRepository()
        self.standard_repository = StandardRepository()
        self.audit_service = AuditEventService()

    def create_clause(
        self,
        db: Session,
        data: StandardClauseCreate,
        actor_user_id: uuid.UUID | None = None,
    ) -> StandardClause:
        standard = self.standard_repository.get_by_tenant_and_id(
            db=db,
            tenant_id=data.tenant_id,
            standard_id=data.standard_id,
        )

        if not standard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Standard not found for tenant.",
            )

        existing_clause = self.repository.get_by_standard_and_clause_number(
            db=db,
            standard_id=data.standard_id,
            clause_number=data.clause_number,
        )

        if existing_clause:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A clause with that number already exists for this standard.",
            )

        if data.parent_clause_id:
            parent_clause = self.repository.get_by_tenant_and_id(
                db=db,
                tenant_id=data.tenant_id,
                clause_id=data.parent_clause_id,
            )

            if not parent_clause or parent_clause.standard_id != data.standard_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent clause must belong to the same standard.",
                )

        clause = self.repository.create(db=db, data=data)

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=clause.tenant_id,
                actor_user_id=actor_user_id,
                entity_type="standard_clause",
                entity_id=clause.id,
                action="created",
                summary=(
                    f"Clause {clause.clause_number} was added to "
                    f"standard {standard.name}."
                ),
                old_values_json=None,
                new_values_json={
                    "standard_id": str(clause.standard_id),
                    "clause_number": clause.clause_number,
                    "title": clause.title,
                    "status": clause.status,
                },
                metadata_json={
                    "source": "standard_clause_service.create_clause",
                    "standard_id": str(clause.standard_id),
                },
            ),
        )

        return clause

    def get_clause_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        clause_id: uuid.UUID,
    ) -> StandardClause:
        clause = self.repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            clause_id=clause_id,
        )

        if not clause:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Clause not found for tenant.",
            )

        return clause

    def list_clauses_for_standard(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        standard_id: uuid.UUID,
    ) -> tuple[list[StandardClause], int]:
        standard = self.standard_repository.get_by_tenant_and_id(
            db=db,
            tenant_id=tenant_id,
            standard_id=standard_id,
        )

        if not standard:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Standard not found for tenant.",
            )

        items = self.repository.list_by_standard(
            db=db,
            tenant_id=tenant_id,
            standard_id=standard_id,
        )

        return items, len(items)

    def update_clause(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        clause_id: uuid.UUID,
        data: StandardClauseUpdate,
        actor_user_id: uuid.UUID | None = None,
    ) -> StandardClause:
        clause = self.get_clause_for_tenant(
            db=db,
            tenant_id=tenant_id,
            clause_id=clause_id,
        )

        if data.parent_clause_id:
            parent_clause = self.repository.get_by_tenant_and_id(
                db=db,
                tenant_id=tenant_id,
                clause_id=data.parent_clause_id,
            )

            if not parent_clause or parent_clause.standard_id != clause.standard_id:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Parent clause must belong to the same standard.",
                )

        old_values = {
            "parent_clause_id": str(clause.parent_clause_id)
            if clause.parent_clause_id
            else None,
            "clause_number": clause.clause_number,
            "title": clause.title,
            "summary": clause.summary,
            "audit_guidance": clause.audit_guidance,
            "evidence_examples": clause.evidence_examples,
            "sort_order": clause.sort_order,
            "status": clause.status,
        }

        updated_clause = self.repository.update(
            db=db,
            clause=clause,
            data=data,
        )

        self.audit_service.create_event(
            db=db,
            data=AuditEventCreate(
                tenant_id=tenant_id,
                actor_user_id=actor_user_id,
                entity_type="standard_clause",
                entity_id=updated_clause.id,
                action="updated",
                summary=f"Clause {updated_clause.clause_number} was updated.",
                old_values_json=old_values,
                new_values_json={
                    "parent_clause_id": str(updated_clause.parent_clause_id)
                    if updated_clause.parent_clause_id
                    else None,
                    "clause_number": updated_clause.clause_number,
                    "title": updated_clause.title,
                    "summary": updated_clause.summary,
                    "audit_guidance": updated_clause.audit_guidance,
                    "evidence_examples": updated_clause.evidence_examples,
                    "sort_order": updated_clause.sort_order,
                    "status": updated_clause.status,
                },
                metadata_json={
                    "source": "standard_clause_service.update_clause",
                    "standard_id": str(updated_clause.standard_id),
                },
            ),
        )

        return updated_clause