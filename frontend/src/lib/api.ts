import type { AuditEventListResponse } from "@/types/auditEvent";
import type { DashboardSummary } from "@/types/dashboard";
import type {
  DocumentListResponse,
  DocumentRecord,
} from "@/types/document";
import type {
  DocumentApprovalListResponse,
  DocumentApprovalRecord,
} from "@/types/documentApproval";
import type {
  DocumentRevisionListResponse,
  DocumentRevisionRecord,
} from "@/types/documentRevision";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch ${url}. Status: ${response.status}. Body: ${errorText}`,
    );
  }

  return response.json();
}

async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  const response = await fetch(url, {
    method: "POST",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Failed to post ${url}. Status: ${response.status}. Body: ${errorText}`,
    );
  }

  return response.json();
}

export type CreateDocumentPayload = {
  tenant_id: string;
  program_id: string | null;
  document_number: string;
  title: string;
  document_type: string;
  owner_user_id: string | null;
  status: string;
  is_controlled: boolean;
  review_due_date: string | null;
  metadata_json: Record<string, unknown> | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
};

export type CreateRevisionPayload = {
  document_id: string;
  tenant_id: string;
  revision_label: string;
  revision_number: number | null;
  change_summary: string | null;
  file_id: string | null;
  external_file_url: string | null;
  status: string;
  is_current: boolean;
  is_effective: boolean;
  effective_date: string | null;
  obsolete_date: string | null;
  approved_by_user_id: string | null;
  created_by_user_id: string | null;
  updated_by_user_id: string | null;
};

export type CreateApprovalPayload = {
  document_revision_id: string;
  tenant_id: string;
  approver_user_id: string;
  approval_type: string;
  status: string;
  comment: string | null;
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>("/dashboard/summary");
}

export async function getDocuments(): Promise<DocumentListResponse> {
  return apiGet<DocumentListResponse>("/documents");
}

export async function getDocument(documentId: string): Promise<DocumentRecord> {
  return apiGet<DocumentRecord>(`/documents/${documentId}`);
}

export async function createDocument(
  payload: CreateDocumentPayload,
): Promise<DocumentRecord> {
  return apiPost<DocumentRecord>("/documents", payload);
}

export async function getDocumentRevisions(
  documentId: string,
): Promise<DocumentRevisionListResponse> {
  return apiGet<DocumentRevisionListResponse>(
    `/document-revisions/by-document/${documentId}`,
  );
}

export async function createDocumentRevision(
  payload: CreateRevisionPayload,
): Promise<DocumentRevisionRecord> {
  return apiPost<DocumentRevisionRecord>("/document-revisions", payload);
}

export async function getDocumentApprovals(
  revisionId: string,
): Promise<DocumentApprovalListResponse> {
  return apiGet<DocumentApprovalListResponse>(
    `/document-approvals/by-revision/${revisionId}`,
  );
}

export async function createDocumentApproval(
  payload: CreateApprovalPayload,
): Promise<DocumentApprovalRecord> {
  return apiPost<DocumentApprovalRecord>("/document-approvals", payload);
}

export async function submitRevisionForReview(
  revisionId: string,
): Promise<DocumentRevisionRecord> {
  return apiPost<DocumentRevisionRecord>(
    `/document-revisions/${revisionId}/submit-for-review`,
  );
}

export async function evaluateRevisionApprovalState(
  revisionId: string,
): Promise<DocumentRevisionRecord> {
  return apiPost<DocumentRevisionRecord>(
    `/document-revisions/${revisionId}/evaluate-approval-state`,
  );
}

export async function makeRevisionEffective(
  revisionId: string,
): Promise<DocumentRevisionRecord> {
  return apiPost<DocumentRevisionRecord>(
    `/document-revisions/${revisionId}/make-effective`,
  );
}

export async function approveDocumentApproval(
  approvalId: string,
  comment: string,
): Promise<DocumentApprovalRecord> {
  return apiPost<DocumentApprovalRecord>(
    `/document-approvals/${approvalId}/approve`,
    { comment },
  );
}

export async function rejectDocumentApproval(
  approvalId: string,
  comment: string,
): Promise<DocumentApprovalRecord> {
  return apiPost<DocumentApprovalRecord>(
    `/document-approvals/${approvalId}/reject`,
    { comment },
  );
}

export async function getAuditEvents(): Promise<AuditEventListResponse> {
  return apiGet<AuditEventListResponse>("/audit-events");
}

export async function getAuditEventsForEntity(
  entityType: string,
  entityId: string,
): Promise<AuditEventListResponse> {
  return apiGet<AuditEventListResponse>(
    `/audit-events/by-entity/${entityType}/${entityId}`,
  );
}

export async function getAuditEventsForTenant(
  tenantId: string,
): Promise<AuditEventListResponse> {
  return apiGet<AuditEventListResponse>(`/audit-events/by-tenant/${tenantId}`);
}