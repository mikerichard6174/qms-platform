export type StandardClauseRecord = {
  id: string;
  tenant_id: string;
  standard_id: string;
  parent_clause_id: string | null;
  clause_number: string;
  title: string;
  summary: string | null;
  audit_guidance: string | null;
  evidence_examples: string | null;
  sort_order: number;
  status: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type StandardClauseListResponse = {
  items: StandardClauseRecord[];
  total: number;
};