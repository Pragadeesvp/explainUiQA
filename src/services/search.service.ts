import { getJWTToken } from '@/utils/auth.utils';
import { getOrganizationId } from '@/auth/adapters/organization.service';

const BASE_URL = import.meta.env.VITE_EXPLAIN_BACKEND_URL;

export interface SearchHit {
  score: number;
  id: string;
  document_name: string;
  chunk_content: string;
}

export interface SearchResponse {
  hits: SearchHit[];
  total_hits: number;
  filters_used: Array<Record<string, unknown>>;
}

export interface SearchRequest {
  query: string;
  company: string;
}

export const search = async (request: SearchRequest): Promise<SearchResponse> => {
  try {
    const jwtToken = getJWTToken();
    const organizationId = getOrganizationId();
    const response = await fetch(`${BASE_URL}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
        'X-Organization-Id': organizationId,
      },
      body: JSON.stringify(request),
    });
    if (!response.ok) {
      throw new Error(`Search request failed with status ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Search error:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}; 