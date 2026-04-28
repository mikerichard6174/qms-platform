import type { DocumentListResponse } from "@/types/document";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

export async function getDocuments(): Promise<DocumentListResponse> {
  const response = await fetch(`${API_BASE_URL}/documents`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch documents. Status: ${response.status}`);
  }

  return response.json();
}