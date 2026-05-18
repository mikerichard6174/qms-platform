export type ProgramStandardMappingRecord = {
  id: string;
  tenant_id: string;
  program_id: string;
  standard_id: string;
  applicability: string;
  status: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ProgramStandardMappingListResponse = {
  items: ProgramStandardMappingRecord[];
  total: number;
};