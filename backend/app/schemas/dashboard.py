from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    total_documents: int
    revisions_in_review: int
    effective_revisions: int
    pending_approvals: int