from sqlalchemy.orm import Session

from app.repositories.dashboard import DashboardRepository
from app.schemas.dashboard import DashboardSummaryResponse


class DashboardService:
    def __init__(self) -> None:
        self.repository = DashboardRepository()

    def get_summary(self, db: Session) -> DashboardSummaryResponse:
        return DashboardSummaryResponse(
            total_documents=self.repository.count_documents(db=db),
            revisions_in_review=self.repository.count_revisions_in_review(db=db),
            effective_revisions=self.repository.count_effective_revisions(db=db),
            pending_approvals=self.repository.count_pending_approvals(db=db),
        )