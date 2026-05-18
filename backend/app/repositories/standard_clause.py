import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.standard_clause import StandardClause
from app.schemas.standard_clause import (
    StandardClauseCreate,
    StandardClauseUpdate,
)


class StandardClauseRepository:
    def create(
        self,
        db: Session,
        data: StandardClauseCreate,
    ) -> StandardClause:
        clause = StandardClause(
            tenant_id=data.tenant_id,
            standard_id=data.standard_id,
            parent_clause_id=data.parent_clause_id,
            clause_number=data.clause_number,
            title=data.title,
            summary=data.summary,
            audit_guidance=data.audit_guidance,
            evidence_examples=data.evidence_examples,
            sort_order=data.sort_order,
            status=data.status,
            metadata_json=data.metadata_json,
        )

        db.add(clause)
        db.commit()
        db.refresh(clause)

        return clause

    def get_by_tenant_and_id(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        clause_id: uuid.UUID,
    ) -> StandardClause | None:
        stmt = select(StandardClause).where(
            StandardClause.tenant_id == tenant_id,
            StandardClause.id == clause_id,
        )

        return db.scalar(stmt)

    def get_by_standard_and_clause_number(
        self,
        db: Session,
        standard_id: uuid.UUID,
        clause_number: str,
    ) -> StandardClause | None:
        stmt = select(StandardClause).where(
            StandardClause.standard_id == standard_id,
            StandardClause.clause_number == clause_number,
        )

        return db.scalar(stmt)

    def list_by_standard(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        standard_id: uuid.UUID,
    ) -> list[StandardClause]:
        stmt = (
            select(StandardClause)
            .where(
                StandardClause.tenant_id == tenant_id,
                StandardClause.standard_id == standard_id,
            )
            .order_by(
                StandardClause.sort_order.asc(),
                StandardClause.clause_number.asc(),
            )
        )

        return list(db.scalars(stmt).all())

    def update(
        self,
        db: Session,
        clause: StandardClause,
        data: StandardClauseUpdate,
    ) -> StandardClause:
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(clause, field, value)

        db.add(clause)
        db.commit()
        db.refresh(clause)

        return clause