export type AuditEventRecord = {
  id: string;
  tenant_id: string;
  actor_user_id: string | null;
  entity_type: string;
  entity_id: string;
  action: string;
  summary: string;
  old_values_json: Record<string, unknown> | null;
  new_values_json: Record<string, unknown> | null;
  metadata_json: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type AuditEventListResponse = {
  items: AuditEventRecord[];
  total: number;
};