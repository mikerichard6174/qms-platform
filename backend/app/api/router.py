from fastapi import APIRouter

from app.api.routes.admin_documents import router as admin_documents_router
from app.api.routes.audit_events import router as audit_events_router
from app.api.routes.auth_session import router as auth_session_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.document_approvals import router as document_approvals_router
from app.api.routes.document_revisions import router as document_revisions_router
from app.api.routes.documents import router as documents_router
from app.api.routes.health import router as health_router
from app.api.routes.program_standard_mappings import (
    router as program_standard_mappings_router,
)
from app.api.routes.programs import router as programs_router
from app.api.routes.standard_clauses import router as standard_clauses_router
from app.api.routes.standards import router as standards_router
from app.api.routes.user_program_assignments import (
    router as user_program_assignments_router,
)

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(auth_session_router)
api_router.include_router(dashboard_router)

api_router.include_router(programs_router)
api_router.include_router(user_program_assignments_router)

api_router.include_router(standards_router)
api_router.include_router(standard_clauses_router)
api_router.include_router(program_standard_mappings_router)

api_router.include_router(documents_router)
api_router.include_router(admin_documents_router)
api_router.include_router(document_revisions_router)
api_router.include_router(document_approvals_router)

api_router.include_router(audit_events_router)