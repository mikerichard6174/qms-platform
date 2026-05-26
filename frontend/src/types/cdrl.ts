export type CdrlRecord = {
  id: string;
  tenant_id: string;
  program_id: string;
  cdrl_number: string;
  title: string;
  description: string | null;
  deliverable_type: string | null;
  frequency: string | null;
  due_date: string | null;
  status: string;
  owner_user_id: string | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type CdrlListResponse = {
  items: CdrlRecord[];
  total: number;
};