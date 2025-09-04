// Shared TypeScript types

export interface Source {
  id: string;
  name: string;
  url: string;
  type: string;
  createdAt: number;
}

export interface Document {
  id: string;
  sourceId: string;
  title?: string;
  url: string;
  publishedAt?: number;
  fetchedAt: number;
  sha256: string;
}

export interface Allocation {
  id: string;
  allocatedTo: string;
  kg: number;
  status: string;
  allocationDate?: number;
  deliveryWindowStart?: number;
  deliveryWindowEnd?: number;
  notes?: string;
  updatedAt: number;
  sourceDocId?: string;
}

export interface DeliveryBatch {
  id: string;
  allocationId: string;
  kg: number;
  status: string;
  shippedAt?: number;
  receivedAt?: number;
  notes?: string;
  updatedAt: number;
}

export interface UpdateEvent {
  id: string;
  entityType: string;
  entityId: string;
  changeJson: string;
  actor: string;
  occurredAt: number;
}

// API Response types
export interface ApiResponse<T> {
  items: T[];
  nextCursor?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

// Allocation status enum
export type AllocationStatus = 'conditional' | 'confirmed';

// Delivery status enum
export type DeliveryStatus = 'planned' | 'shipped' | 'received';

// Source type enum
export type SourceType = 'regulator' | 'vendor' | 'press';
