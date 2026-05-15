import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.program import Program
from app.schemas.program import ProgramCreate, ProgramUpdate


class ProgramRepository:
    def create(self, db: Session, data: ProgramCreate) -> Program:
        program = Program(
            tenant_id=data.tenant_id,
            name=data.name,
            code=data.code,
            description=data.description,
            status=data.status,
            start_date=data.start_date,
            end_date=data.end_date,
            metadata_json=data.metadata_json,
        )
        db.add(program)
        db.commit()
        db.refresh(program)
        return program

    def save(self, db: Session, program: Program) -> Program:
        db.add(program)
        db.commit()
        db.refresh(program)
        return program

    def get_by_tenant_and_id(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> Program | None:
        stmt = select(Program).where(
            Program.tenant_id == tenant_id,
            Program.id == program_id,
        )
        return db.scalar(stmt)

    def get_by_code(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        code: str,
    ) -> Program | None:
        stmt = select(Program).where(
            Program.tenant_id == tenant_id,
            Program.code == code,
        )
        return db.scalar(stmt)

    def list_by_tenant(
        self,
        db: Session,
        tenant_id: uuid.UUID,
    ) -> list[Program]:
        stmt = (
            select(Program)
            .where(Program.tenant_id == tenant_id)
            .order_by(Program.name.asc())
        )
        return list(db.scalars(stmt).all())

    def update(
        self,
        db: Session,
        program: Program,
        data: ProgramUpdate,
    ) -> Program:
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(program, field, value)

        db.add(program)
        db.commit()
        db.refresh(program)
        return program