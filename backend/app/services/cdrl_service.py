import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cdrl import Cdrl
from app.repositories.cdrl_repository import CdrlRepository
from app.schemas.cdrl import CdrlCreate, CdrlUpdate


class CdrlService:
    def __init__(self) -> None:
        self.repository = CdrlRepository()

    def create_cdrl(
        self,
        db: Session,
        data: CdrlCreate,
    ) -> Cdrl:
        existing = self.repository.list_by_program(
            db=db,
            tenant_id=data.tenant_id,
            program_id=data.program_id,
        )

        for cdrl in existing:
            if cdrl.cdrl_number.lower() == data.cdrl_number.lower():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A CDRL with this number already exists for the program.",
                )

        return self.repository.create(
            db=db,
            data=data,
        )

    def get_cdrl_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        cdrl_id: uuid.UUID,
    ) -> Cdrl:
        cdrl = self.repository.get_by_id(
            db=db,
            tenant_id=tenant_id,
            cdrl_id=cdrl_id,
        )

        if not cdrl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CDRL not found.",
            )

        return cdrl

    def list_cdrls_for_program(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> tuple[list[Cdrl], int]:
        items = self.repository.list_by_program(
            db=db,
            tenant_id=tenant_id,
            program_id=program_id,
        )

        return items, len(items)

    def update_cdrl(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        cdrl_id: uuid.UUID,
        data: CdrlUpdate,
    ) -> Cdrl:
        cdrl = self.get_cdrl_for_tenant(
            db=db,
            tenant_id=tenant_id,
            cdrl_id=cdrl_id,
        )

        return self.repository.update(
            db=db,
            cdrl=cdrl,
            data=data,
        )

    def delete_cdrl(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        cdrl_id: uuid.UUID,
    ) -> None:
        cdrl = self.get_cdrl_for_tenant(
            db=db,
            tenant_id=tenant_id,
            cdrl_id=cdrl_id,
        )

        self.repository.delete(
            db=db,
            cdrl=cdrl,
        )