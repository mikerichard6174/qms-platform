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
import type {
  UserProgramAssignmentListResponse,
  UserProgramAssignmentRecord,
} from "@/types/userProgramAssignment";
import type {
  StandardListResponse,
  StandardRecord,
} from "@/types/standard";

import type {
  StandardClauseListResponse,
  StandardClauseRecord,
} from "@/types/standardClause";

import type {
  ProgramStandardMappingListResponse,
  ProgramStandardMappingRecord,
} from "@/types/programStandardMapping";

import type {
  CdrlListResponse,
  CdrlRecord,
} from "@/types/cdrl";

import type {
  CdrlClauseMappingListResponse,
  CdrlClauseMappingRecord,
} from "@/types/cdrlClauseMapping";

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

async function apiDelete(
  path: string,
  headers?: Record<string, string>,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }
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

export type CreateUserProgramAssignmentPayload = {
  tenant_id: string;
  user_id: string;
  program_id: string;
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

export type AssignDocumentProgramPayload = {
  program_id: string;
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

export type CreateStandardPayload = {
  tenant_id: string;
  name: string;
  revision: string | null;
  issuing_body: string | null;
  description: string | null;
  status: string;
  metadata_json: Record<string, unknown> | null;
};

export type CreateStandardClausePayload = {
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
};

export type CreateProgramStandardMappingPayload = {
  tenant_id: string;
  program_id: string;
  standard_id: string;
  applicability: string;
  status: string;
  metadata_json: Record<string, unknown> | null;
};

export type CreateCdrlPayload = {
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
};

export type CreateCdrlClauseMappingPayload = {
  tenant_id: string;
  cdrl_id: string;
  standard_clause_id: string;
  applicability: string;
  rationale: string | null;
  status: string;
  metadata_json: Record<string, unknown> | null;
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

export async function createUserProgramAssignment(
  payload: CreateUserProgramAssignmentPayload,
): Promise<UserProgramAssignmentRecord> {
  return apiPost<UserProgramAssignmentRecord>(
    "/user-program-assignments",
    payload,
    tenantHeaders(),
  );
}

export async function getUserProgramAssignments(
  userId: string,
): Promise<UserProgramAssignmentListResponse> {
  return apiGet<UserProgramAssignmentListResponse>(
    `/user-program-assignments/by-user/${userId}`,
    tenantHeaders(),
  );
}

export async function revokeUserProgramAssignment(
  assignmentId: string,
): Promise<void> {
  return apiDelete(
    `/user-program-assignments/${assignmentId}`,
    tenantUserHeaders(),
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

export async function getUnassignedDocuments(): Promise<DocumentListResponse> {
  return apiGet<DocumentListResponse>(
    "/admin/documents/unassigned",
    tenantHeaders(),
  );
}

export async function assignDocumentToProgram(
  documentId: string,
  payload: AssignDocumentProgramPayload,
): Promise<DocumentRecord> {
  return apiPut<DocumentRecord>(
    `/admin/documents/${documentId}/program`,
    payload,
    tenantUserHeaders(),
  );
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

export async function getStandards(): Promise<StandardListResponse> {
  return apiGet<StandardListResponse>(
    "/standards",
    tenantHeaders(),
  );
}

export async function getStandard(
  standardId: string,
): Promise<StandardRecord> {
  return apiGet<StandardRecord>(
    `/standards/${standardId}`,
    tenantHeaders(),
  );
}

export async function createStandard(
  payload: CreateStandardPayload,
): Promise<StandardRecord> {
  return apiPost<StandardRecord>(
    "/standards",
    payload,
    tenantUserHeaders(),
  );
}

export async function getStandardClauses(
  standardId: string,
): Promise<StandardClauseListResponse> {
  return apiGet<StandardClauseListResponse>(
    `/standard-clauses/by-standard/${standardId}`,
    tenantHeaders(),
  );
}

export async function createStandardClause(
  payload: CreateStandardClausePayload,
): Promise<StandardClauseRecord> {
  return apiPost<StandardClauseRecord>(
    "/standard-clauses",
    payload,
    tenantUserHeaders(),
  );
}

export async function getProgramStandardMappings(
  programId: string,
): Promise<ProgramStandardMappingListResponse> {
  return apiGet<ProgramStandardMappingListResponse>(
    `/program-standard-mappings/by-program/${programId}`,
    tenantHeaders(),
  );
}

export async function createProgramStandardMapping(
  payload: CreateProgramStandardMappingPayload,
): Promise<ProgramStandardMappingRecord> {
  return apiPost<ProgramStandardMappingRecord>(
    "/program-standard-mappings",
    payload,
    tenantUserHeaders(),
  );
}
export async function getCdrlsForProgram(
  programId: string,
): Promise<CdrlListResponse> {
  return apiGet<CdrlListResponse>(
    `/cdrls/by-program/${programId}`,
    tenantHeaders(),
  );
}

export async function createCdrl(
  payload: CreateCdrlPayload,
): Promise<CdrlRecord> {
  return apiPost<CdrlRecord>(
    "/cdrls",
    payload,
    tenantUserHeaders(),
  );
}

export async function getCdrlClauseMappings(
  cdrlId: string,
): Promise<CdrlClauseMappingListResponse> {
  return apiGet<CdrlClauseMappingListResponse>(
    `/cdrl-clause-mappings/by-cdrl/${cdrlId}`,
    tenantHeaders(),
  );
}

export async function createCdrlClauseMapping(
  payload: CreateCdrlClauseMappingPayload,
): Promise<CdrlClauseMappingRecord> {
  return apiPost<CdrlClauseMappingRecord>(
    "/cdrl-clause-mappings",
    payload,
    tenantUserHeaders(),
  );
}