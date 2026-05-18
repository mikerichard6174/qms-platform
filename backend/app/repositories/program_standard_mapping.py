import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.program_standard_mapping import ProgramStandardMapping
from app.schemas.program_standard_mapping import (
    ProgramStandardMappingCreate,
    ProgramStandardMappingUpdate,
)


class ProgramStandardMappingRepository:
    def create(
        self,
        db: Session,
        data: ProgramStandardMappingCreate,
    ) -> ProgramStandardMapping:
        mapping = ProgramStandardMapping(
            tenant_id=data.tenant_id,
            program_id=data.program_id,
            standard_id=data.standard_id,
            applicability=data.applicability,
            status=data.status,
            metadata_json=data.metadata_json,
        )

        db.add(mapping)
        db.commit()
        db.refresh(mapping)

        return mapping

    def get_by_tenant_and_id(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        mapping_id: uuid.UUID,
    ) -> ProgramStandardMapping | None:
        stmt = select(ProgramStandardMapping).where(
            ProgramStandardMapping.tenant_id == tenant_id,
            ProgramStandardMapping.id == mapping_id,
        )

        return db.scalar(stmt)

    def get_existing_mapping(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        program_id: uuid.UUID,
        standard_id: uuid.UUID,
    ) -> ProgramStandardMapping | None:
        stmt = select(ProgramStandardMapping).where(
            ProgramStandardMapping.tenant_id == tenant_id,
            ProgramStandardMapping.program_id == program_id,
            ProgramStandardMapping.standard_id == standard_id,
        )

        return db.scalar(stmt)

    def list_by_program(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> list[ProgramStandardMapping]:
        stmt = (
            select(ProgramStandardMapping)
            .where(
                ProgramStandardMapping.tenant_id == tenant_id,
                ProgramStandardMapping.program_id == program_id,
            )
            .order_by(ProgramStandardMapping.created_at.asc())
        )

        return list(db.scalars(stmt).all())

    def update(
        self,
        db: Session,
        mapping: ProgramStandardMapping,
        data: ProgramStandardMappingUpdate,
    ) -> ProgramStandardMapping:
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(mapping, field, value)

        db.add(mapping)
        db.commit()
        db.refresh(mapping)

        return mapping