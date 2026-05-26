import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.cdrl_clause_mapping import CdrlClauseMapping
from app.repositories.cdrl_clause_mapping_repository import (
    CdrlClauseMappingRepository,
)
from app.repositories.cdrl_repository import CdrlRepository
from app.repositories.standard_clause import StandardClauseRepository
from app.schemas.cdrl_clause_mapping import (
    CdrlClauseMappingCreate,
    CdrlClauseMappingUpdate,
)


class CdrlClauseMappingService:
    def __init__(self) -> None:
        self.repository = CdrlClauseMappingRepository()
        self.cdrl_repository = CdrlRepository()
        self.standard_clause_repository = StandardClauseRepository()

    def create_mapping(
        self,
        db: Session,
        data: CdrlClauseMappingCreate,
    ) -> CdrlClauseMapping:
        cdrl = self.cdrl_repository.get_by_id(
            db=db,
            tenant_id=data.tenant_id,
            cdrl_id=data.cdrl_id,
        )

        if not cdrl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CDRL not found.",
            )

        clause = self.standard_clause_repository.get_by_tenant_and_id(
            db=db,
            tenant_id=data.tenant_id,
            clause_id=data.standard_clause_id,
        )

        if not clause:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Standard clause not found.",
            )

        existing = self.repository.get_existing(
            db=db,
            tenant_id=data.tenant_id,
            cdrl_id=data.cdrl_id,
            standard_clause_id=data.standard_clause_id,
        )

        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This clause is already mapped to the selected CDRL.",
            )

        return self.repository.create(
            db=db,
            data=data,
        )

    def get_mapping_for_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        mapping_id: uuid.UUID,
    ) -> CdrlClauseMapping:
        mapping = self.repository.get_by_id(
            db=db,
            tenant_id=tenant_id,
            mapping_id=mapping_id,
        )

        if not mapping:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CDRL clause mapping not found.",
            )

        return mapping

    def list_mappings_for_cdrl(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        cdrl_id: uuid.UUID,
    ) -> tuple[list[CdrlClauseMapping], int]:
        cdrl = self.cdrl_repository.get_by_id(
            db=db,
            tenant_id=tenant_id,
            cdrl_id=cdrl_id,
        )

        if not cdrl:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="CDRL not found.",
            )

        items = self.repository.list_by_cdrl(
            db=db,
            tenant_id=tenant_id,
            cdrl_id=cdrl_id,
        )

        return items, len(items)

    def update_mapping(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        mapping_id: uuid.UUID,
        data: CdrlClauseMappingUpdate,
    ) -> CdrlClauseMapping:
        mapping = self.get_mapping_for_tenant(
            db=db,
            tenant_id=tenant_id,
            mapping_id=mapping_id,
        )

        return self.repository.update(
            db=db,
            mapping=mapping,
            data=data,
        )

    def delete_mapping(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        mapping_id: uuid.UUID,
    ) -> None:
        mapping = self.get_mapping_for_tenant(
            db=db,
            tenant_id=tenant_id,
            mapping_id=mapping_id,
        )

        self.repository.delete(
            db=db,
            mapping=mapping,
        )