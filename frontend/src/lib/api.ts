import type { AuthSession } from "@/types/authSession";
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
import type { ProgramListResponse, ProgramRecord } from "@/types/program";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

function getTenantId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem("tenant_id");
}

function getUserId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return sessionStorage.getItem("user_id");
}

function tenantHeaders(): Record<string, string> {
  const tenantId = getTenantId();

  if (!tenantId) {
    throw new Error("Not logged in. Tenant is missing.");
  }

  return {
    "X-Tenant-ID": tenantId,
  };
}

function tenantUserHeaders(): Record<string, string> {
  const tenantId = getTenantId();
  const userId = getUserId();

  if (!tenantId || !userId) {
    throw new Error("Not logged in. Tenant or user is missing.");
  }

  return {
    "X-Tenant-ID": tenantId,
    "X-User-ID": userId,
  };
}

function buildAuditQuery(limit = 100, offset = 0): string {
  return `limit=${limit}&offset=${offset}`;
}

async function apiGet<T>(
  path: string,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function apiPost<T>(
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

async function apiPut<T>(
  path: string,
  body?: unknown,
  headers?: Record<string, string>,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  return response.json();
}

export type CreateProgramPayload = {
  tenant_id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  metadata_json: Record<string, unknown> | null;
};

export type UpdateProgramPayload = {
  name?: string | null;
  code?: string | null;
  description?: string | null;
  status?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  metadata_json?: Record<string, unknown> | null;
};

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

export async function getAuthSession(
  tenantId: string,
  userId: string,
): Promise<AuthSession> {
  return apiGet<AuthSession>("/auth/session", {
    "X-Tenant-ID": tenantId,
    "X-User-ID": userId,
  });
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return apiGet<DashboardSummary>("/dashboard/summary");
}

export async function getPrograms(): Promise<ProgramListResponse> {
  return apiGet<ProgramListResponse>("/programs", tenantHeaders());
}

export async function getProgram(id: string): Promise<ProgramRecord> {
  return apiGet<ProgramRecord>(`/programs/${id}`, tenantHeaders());
}

export async function createProgram(
  payload: CreateProgramPayload,
): Promise<ProgramRecord> {
  return apiPost<ProgramRecord>("/programs", payload, tenantHeaders());
}

export async function updateProgram(
  programId: string,
  payload: UpdateProgramPayload,
): Promise<ProgramRecord> {
  return apiPut<ProgramRecord>(
    `/programs/${programId}`,
    payload,
    tenantHeaders(),
  );
}

export async function getDocuments(): Promise<DocumentListResponse> {
  return apiGet<DocumentListResponse>("/documents", tenantUserHeaders());
}

export async function getDocument(id: string): Promise<DocumentRecord> {
  return apiGet<DocumentRecord>(`/documents/${id}`, tenantUserHeaders());
}

export async function createDocument(
  payload: CreateDocumentPayload,
): Promise<DocumentRecord> {
  return apiPost<DocumentRecord>("/documents", payload, tenantUserHeaders());
}

export async function getDocumentRevisions(
  documentId: string,
): Promise<DocumentRevisionListResponse> {
  return apiGet<DocumentRevisionListResponse>(
    `/document-revisions/by-document/${documentId}`,
    tenantHeaders(),
  );
}

export async function createDocumentRevision(
  payload: CreateRevisionPayload,
): Promise<DocumentRevisionRecord> {
  return apiPost<DocumentRevisionRecord>(
    "/document-revisions",
    payload,
    tenantUserHeaders(),
  );
}

export async function submitRevisionForReview(
  revisionId: string,
): Promise<DocumentRevisionRecord> {
  return apiPost<DocumentRevisionRecord>(
    `/document-revisions/${revisionId}/submit-for-review`,
    undefined,
    tenantUserHeaders(),
  );
}

export async function evaluateRevisionApprovalState(
  revisionId: string,
): Promise<DocumentRevisionRecord> {
  return apiPost<DocumentRevisionRecord>(
    `/document-revisions/${revisionId}/evaluate-approval-state`,
    undefined,
    tenantUserHeaders(),
  );
}

export async function makeRevisionEffective(
  revisionId: string,
): Promise<DocumentRevisionRecord> {
  return apiPost<DocumentRevisionRecord>(
    `/document-revisions/${revisionId}/make-effective`,
    undefined,
    tenantUserHeaders(),
  );
}

export async function getDocumentApprovals(
  revisionId: string,
): Promise<DocumentApprovalListResponse> {
  return apiGet<DocumentApprovalListResponse>(
    `/document-approvals/by-revision/${revisionId}`,
    tenantHeaders(),
  );
}

export async function createDocumentApproval(
  payload: CreateApprovalPayload,
): Promise<DocumentApprovalRecord> {
  return apiPost<DocumentApprovalRecord>(
    "/document-approvals",
    payload,
    tenantUserHeaders(),
  );
}

export async function approveDocumentApproval(
  approvalId: string,
  comment: string,
): Promise<DocumentApprovalRecord> {
  return apiPost<DocumentApprovalRecord>(
    `/document-approvals/${approvalId}/approve`,
    { comment },
    tenantUserHeaders(),
  );
}

export async function rejectDocumentApproval(
  approvalId: string,
  comment: string,
): Promise<DocumentApprovalRecord> {
  return apiPost<DocumentApprovalRecord>(
    `/document-approvals/${approvalId}/reject`,
    { comment },
    tenantUserHeaders(),
  );
}

export async function getAuditEvents(
  limit = 100,
  offset = 0,
): Promise<AuditEventListResponse> {
  return apiGet<AuditEventListResponse>(
    `/audit-events?${buildAuditQuery(limit, offset)}`,
    tenantHeaders(),
  );
}

export async function getAuditEventsForEntity(
  entityType: string,
  entityId: string,
  limit = 100,
  offset = 0,
): Promise<AuditEventListResponse> {
  return apiGet<AuditEventListResponse>(
    `/audit-events/by-entity/${entityType}/${entityId}?${buildAuditQuery(
      limit,
      offset,
    )}`,
    tenantHeaders(),
  );
}

export async function getAuditEventsForTenant(
  tenantId: string,
  limit = 100,
  offset = 0,
): Promise<AuditEventListResponse> {
  return apiGet<AuditEventListResponse>(
    `/audit-events/by-tenant/${tenantId}?${buildAuditQuery(limit, offset)}`,
    tenantHeaders(),
  );
}