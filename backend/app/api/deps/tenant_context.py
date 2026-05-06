import uuid

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

import app.models  # noqa: F401
from app.api.deps.db import get_db
from app.models.tenant import Tenant


def require_tenant_id_header(
    db: Session = Depends(get_db),
    x_tenant_id: str | None = Header(default=None, alias="X-Tenant-ID"),
) -> uuid.UUID:
    if not x_tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing required X-Tenant-ID header.",
        )

    try:
        tenant_id = uuid.UUID(x_tenant_id)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="X-Tenant-ID must be a valid UUID.",
        ) from exc

    stmt = select(Tenant).where(
        Tenant.id == tenant_id,
        Tenant.status == "active",
    )
    tenant = db.scalar(stmt)

    if not tenant:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Active tenant not found.",
        )

    return tenant_id