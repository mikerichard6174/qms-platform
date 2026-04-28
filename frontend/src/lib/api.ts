import type {
  DocumentListResponse,
  DocumentRecord,
} from "@/types/document";
import type { DocumentApprovalListResponse } from "@/types/documentApproval";
import type { DocumentRevisionListResponse } from "@/types/documentRevision";

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

export async function getDocuments(): Promise<DocumentListResponse> {
  return apiGet<DocumentListResponse>("/documents");
}

export async function getDocument(documentId: string): Promise<DocumentRecord> {
  return apiGet<DocumentRecord>(`/documents/${documentId}`);
}

export async function getDocumentRevisions(
  documentId: string,
): Promise<DocumentRevisionListResponse> {
  return apiGet<DocumentRevisionListResponse>(
    `/document-revisions/by-document/${documentId}`,
  );
}

export async function getDocumentApprovals(
  revisionId: string,
): Promise<DocumentApprovalListResponse> {
  return apiGet<DocumentApprovalListResponse>(
    `/document-approvals/by-revision/${revisionId}`,
  );
}