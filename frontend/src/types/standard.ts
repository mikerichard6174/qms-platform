export type StandardRecord = {
  id: string;
  tenant_id: string;
  name: string;
  revision: string | null;
  issuing_body: string | null;
  description: string | null;
  status: string;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type StandardListResponse = {
  items: StandardRecord[];
  total: number;
};