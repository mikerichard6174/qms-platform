import uuid

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps.db import get_db
from app.models.user import User


def require_user_id_header(
    db: Session = Depends(get_db),
    x_user_id: str | None = Header(default=None, alias="X-User-ID"),
) -> uuid.UUID:
    if not x_user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required X-User-ID header.",
        )

    try:
        user_id = uuid.UUID(x_user_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-User-ID must be a valid UUID.",
        ) from exc

    stmt = select(User).where(
        User.id == user_id,
        User.is_active == True,
    )
    user = db.scalar(stmt)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active user not found.",
        )

    return user_id