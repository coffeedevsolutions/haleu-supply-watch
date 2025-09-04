import type { Allocation, UpdateEvent, ApiResponse } from '@hsw/shared';

export const apiBase = (() => {
  const b = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8787').trim();
  return b;
})();

export interface AllocationWithDeliveries {
  allocation: Allocation;
  deliveries: any[];
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || apiBase;
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    return response.json();
  }

  async getAllocations(params?: {
    status?: string;
    since?: string;
    limit?: number;
    cursor?: string;
  }): Promise<ApiResponse<Allocation>> {
    const searchParams = new URLSearchParams();
    
    if (params?.status) searchParams.set('status', params.status);
    if (params?.since) searchParams.set('since', params.since);
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);

    const query = searchParams.toString();
    const path = `/v1/allocations${query ? `?${query}` : ''}`;
    
    return this.request<ApiResponse<Allocation>>(path);
  }

  async getAllocation(id: string): Promise<AllocationWithDeliveries> {
    return this.request<AllocationWithDeliveries>(`/v1/allocations/${id}`);
  }

  async getChanges(params?: {
    limit?: number;
    cursor?: string;
  }): Promise<ApiResponse<UpdateEvent>> {
    const searchParams = new URLSearchParams();
    
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.cursor) searchParams.set('cursor', params.cursor);

    const query = searchParams.toString();
    const path = `/v1/changes${query ? `?${query}` : ''}`;
    
    return this.request<ApiResponse<UpdateEvent>>(path);
  }

  async getSources(): Promise<{ items: any[] }> {
    return this.request<{ items: any[] }>('/v1/sources');
  }

  async getDocument(id: string): Promise<any> {
    return this.request<any>(`/v1/documents/${id}`);
  }
}

export const api = new ApiClient();
