import uuid

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.models.cdrl import Cdrl
from app.schemas.cdrl import CdrlCreate, CdrlUpdate


class CdrlRepository:
    def create(
        self,
        db: Session,
        data: CdrlCreate,
    ) -> Cdrl:
        cdrl = Cdrl(**data.model_dump())

        db.add(cdrl)
        db.commit()
        db.refresh(cdrl)

        return cdrl

    def get_by_id(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        cdrl_id: uuid.UUID,
    ) -> Cdrl | None:
        stmt: Select[tuple[Cdrl]] = select(Cdrl).where(
            Cdrl.id == cdrl_id,
            Cdrl.tenant_id == tenant_id,
        )

        return db.execute(stmt).scalar_one_or_none()

    def list_by_program(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> list[Cdrl]:
        stmt: Select[tuple[Cdrl]] = (
            select(Cdrl)
            .where(
                Cdrl.tenant_id == tenant_id,
                Cdrl.program_id == program_id,
            )
            .order_by(Cdrl.cdrl_number.asc())
        )

        return list(db.execute(stmt).scalars().all())

    def update(
        self,
        db: Session,
        cdrl: Cdrl,
        data: CdrlUpdate,
    ) -> Cdrl:
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(cdrl, field, value)

        db.add(cdrl)
        db.commit()
        db.refresh(cdrl)

        return cdrl

    def delete(
        self,
        db: Session,
        cdrl: Cdrl,
    ) -> None:
        db.delete(cdrl)
        db.commit()