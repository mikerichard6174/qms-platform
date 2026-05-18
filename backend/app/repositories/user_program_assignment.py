import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user_program_assignment import UserProgramAssignment
from app.schemas.user_program_assignment import UserProgramAssignmentCreate


class UserProgramAssignmentRepository:
    def create(
        self,
        db: Session,
        data: UserProgramAssignmentCreate,
    ) -> UserProgramAssignment:
        assignment = UserProgramAssignment(
            tenant_id=data.tenant_id,
            user_id=data.user_id,
            program_id=data.program_id,
        )

        db.add(assignment)
        db.commit()
        db.refresh(assignment)

        return assignment

    def delete(
        self,
        db: Session,
        assignment: UserProgramAssignment,
    ) -> None:
        db.delete(assignment)
        db.commit()

    def get_by_tenant_and_id(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        assignment_id: uuid.UUID,
    ) -> UserProgramAssignment | None:
        stmt = select(UserProgramAssignment).where(
            UserProgramAssignment.tenant_id == tenant_id,
            UserProgramAssignment.id == assignment_id,
        )

        return db.scalar(stmt)

    def get_existing_assignment(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
        program_id: uuid.UUID,
    ) -> UserProgramAssignment | None:
        stmt = select(UserProgramAssignment).where(
            UserProgramAssignment.tenant_id == tenant_id,
            UserProgramAssignment.user_id == user_id,
            UserProgramAssignment.program_id == program_id,
        )

        return db.scalar(stmt)

    def list_by_user(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> list[UserProgramAssignment]:
        stmt = (
            select(UserProgramAssignment)
            .where(
                UserProgramAssignment.tenant_id == tenant_id,
                UserProgramAssignment.user_id == user_id,
            )
            .order_by(UserProgramAssignment.created_at.desc())
        )

        return list(db.scalars(stmt).all())

    def list_program_ids_for_user(
        self,
        db: Session,
        tenant_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> list[uuid.UUID]:
        stmt = select(UserProgramAssignment.program_id).where(
            UserProgramAssignment.tenant_id == tenant_id,
            UserProgramAssignment.user_id == user_id,
        )

        return list(db.scalars(stmt).all())