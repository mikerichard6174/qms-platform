export type ProgramRecord = {
  id: string;
  tenant_id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type ProgramListResponse = {
  items: ProgramRecord[];
  total: number;
};