export type DocumentRevisionRecord = {
  id: string;
  document_id: string;
  tenant_id: string;
  revision_label: string;
  revision_number: number | null;
  change_summary: string | null;
  file_id: string | null;
  status: string;
  is_current: boolean;
  is_effective: boolean;
  effective_date: string | null;
  obsolete_date: string | null;
  submitted_for_approval_at: string | null;
  approved_at: string | null;
  approved_by_user_id: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentRevisionListResponse = {
  items: DocumentRevisionRecord[];
  total: number;
};