export type CdrlClauseMappingRecord = {
  id: string;
  tenant_id: string;
  cdrl_id: string;
  standard_clause_id: string;
  applicability: string;
  rationale: string | null;
  status: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type CdrlClauseMappingListResponse = {
  items: CdrlClauseMappingRecord[];
  total: number;
};