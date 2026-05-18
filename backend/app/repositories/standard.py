import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.standard import Standard
from app.schemas.standard import StandardCreate, StandardUpdate


class StandardRepository:
    def create(self, db: Session, data: StandardCreate) -> Standard:
        standard = Standard(
            tenant_id=data.tenant_id,
            name=data.name,
            revision=data.revision,
            issuing_body=data.issuing_body,
            description=data.description,
            status=data.status,
            metadata_json=data.metadata_json,
        )

        db.add(standard)
        db.commit()
        db.refresh(standard)

        return standard

    def get_by_tenant_and_id(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        standard_id: uuid.UUID,
    ) -> Standard | None:
        stmt = select(Standard).where(
            Standard.tenant_id == tenant_id,
            Standard.id == standard_id,
        )

        return db.scalar(stmt)

    def get_by_name_revision(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        name: str,
        revision: str | None,
    ) -> Standard | None:
        stmt = select(Standard).where(
            Standard.tenant_id == tenant_id,
            Standard.name == name,
            Standard.revision == revision,
        )

        return db.scalar(stmt)

    def list_by_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
    ) -> list[Standard]:
        stmt = (
            select(Standard)
            .where(Standard.tenant_id == tenant_id)
            .order_by(Standard.name.asc(), Standard.revision.asc())
        )

        return list(db.scalars(stmt).all())

    def update(
        self,
        db: Session,
        standard: Standard,
        data: StandardUpdate,
    ) -> Standard:
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(standard, field, value)

        db.add(standard)
        db.commit()
        db.refresh(standard)

        return standard