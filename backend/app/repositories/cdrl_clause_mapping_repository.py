import uuid

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.cdrl_clause_mapping import CdrlClauseMapping
from app.schemas.cdrl_clause_mapping import (
    CdrlClauseMappingCreate,
    CdrlClauseMappingUpdate,
)


class CdrlClauseMappingRepository:
    def create(
        self,
        db: Session,
        data: CdrlClauseMappingCreate,
    ) -> CdrlClauseMapping:
        mapping = CdrlClauseMapping(**data.model_dump())

        db.add(mapping)
        db.commit()
        db.refresh(mapping)

        return mapping

    def get_by_id(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        mapping_id: uuid.UUID,
    ) -> CdrlClauseMapping | None:
        stmt: Select[tuple[CdrlClauseMapping]] = select(
            CdrlClauseMapping,
        ).where(
            CdrlClauseMapping.id == mapping_id,
            CdrlClauseMapping.tenant_id == tenant_id,
        )

        return db.execute(stmt).scalar_one_or_none()

    def get_existing(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        cdrl_id: uuid.UUID,
        standard_clause_id: uuid.UUID,
    ) -> CdrlClauseMapping | None:
        stmt: Select[tuple[CdrlClauseMapping]] = select(
            CdrlClauseMapping,
        ).where(
            CdrlClauseMapping.tenant_id == tenant_id,
            CdrlClauseMapping.cdrl_id == cdrl_id,
            CdrlClauseMapping.standard_clause_id == standard_clause_id,
        )

        return db.execute(stmt).scalar_one_or_none()

    def list_by_cdrl(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        cdrl_id: uuid.UUID,
    ) -> list[CdrlClauseMapping]:
        stmt: Select[tuple[CdrlClauseMapping]] = (
            select(CdrlClauseMapping)
            .where(
                CdrlClauseMapping.tenant_id == tenant_id,
                CdrlClauseMapping.cdrl_id == cdrl_id,
            )
            .order_by(CdrlClauseMapping.created_at.asc())
        )

        return list(db.execute(stmt).scalars().all())

    def update(
        self,
        db: Session,
        mapping: CdrlClauseMapping,
        data: CdrlClauseMappingUpdate,
    ) -> CdrlClauseMapping:
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(mapping, field, value)

        db.add(mapping)
        db.commit()
        db.refresh(mapping)

        return mapping

    def delete(
        self,
        db: Session,
        mapping: CdrlClauseMapping,
    ) -> None:
        db.delete(mapping)
        db.commit()