export type DocumentRecord = {
  id: string;
  tenant_id: string;
  program_id: string | null;
  document_number: string;
  title: string;
  document_type: string;
  owner_user_id: string | null;
  current_revision_id: string | null;
  status: string;
  is_controlled: boolean;
  review_due_date: string | null;
  metadata_json: Record<string, unknown> | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentListResponse = {
  items: DocumentRecord[];
  total: number;
};