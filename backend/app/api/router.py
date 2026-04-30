from fastapi import APIRouter

from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.document_approvals import router as document_approvals_router
from app.api.routes.document_revisions import router as document_revisions_router
from app.api.routes.documents import router as documents_router
from app.api.routes.health import router as health_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(dashboard_router)
api_router.include_router(documents_router)
api_router.include_router(document_revisions_router)
api_router.include_router(document_approvals_router)