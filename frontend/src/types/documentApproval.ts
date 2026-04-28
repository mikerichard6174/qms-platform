export type DocumentApprovalRecord = {
  id: string;
  document_revision_id: string;
  tenant_id: string;
  approver_user_id: string;
  approval_type: string;
  status: string;
  comment: string | null;
  acted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentApprovalListResponse = {
  items: DocumentApprovalRecord[];
  total: number;
};