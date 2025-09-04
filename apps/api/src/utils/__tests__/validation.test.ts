import { describe, it, expect } from 'vitest';
import { 
  AllocationUpsertSchema, 
  DeliveryBatchUpsertSchema,
  AllocationsBulkUpsertSchema 
} from '@hsw/shared';

describe('Validation Schemas', () => {
  describe('AllocationUpsertSchema', () => {
    it('should validate a complete allocation', () => {
      const validAllocation = {
        id: 'doe-2024-001',
        allocated_to: 'X-energy',
        kg: 1200,
        status: 'confirmed' as const,
        allocation_date: 1704067200,
        delivery_window_start: 1735689600,
        delivery_window_end: 1767225600,
        notes: 'Initial production allocation',
        source_doc_id: 'doc-001'
      };

      const result = AllocationUpsertSchema.safeParse(validAllocation);
      expect(result.success).toBe(true);
    });

    it('should validate minimal allocation', () => {
      const minimalAllocation = {
        id: 'doe-2024-002',
        allocated_to: 'TerraPower',
        kg: 850,
        status: 'conditional' as const
      };

      const result = AllocationUpsertSchema.safeParse(minimalAllocation);
      expect(result.success).toBe(true);
    });

    it('should reject invalid allocations', () => {
      const invalidAllocations = [
        { id: '', allocated_to: 'X-energy', kg: 1200, status: 'confirmed' }, // Empty ID
        { id: 'doe-001', allocated_to: '', kg: 1200, status: 'confirmed' }, // Empty allocated_to
        { id: 'doe-001', allocated_to: 'X-energy', kg: 0, status: 'confirmed' }, // Zero kg
        { id: 'doe-001', allocated_to: 'X-energy', kg: -100, status: 'confirmed' }, // Negative kg
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200, status: 'invalid' }, // Invalid status
        { allocated_to: 'X-energy', kg: 1200, status: 'confirmed' }, // Missing ID
        { id: 'doe-001', kg: 1200, status: 'confirmed' }, // Missing allocated_to
        { id: 'doe-001', allocated_to: 'X-energy', status: 'confirmed' }, // Missing kg
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200 }, // Missing status
      ];

      invalidAllocations.forEach((allocation, index) => {
        const result = AllocationUpsertSchema.safeParse(allocation);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('DeliveryBatchUpsertSchema', () => {
    it('should validate a complete delivery batch', () => {
      const validBatch = {
        id: 'batch-001',
        allocation_id: 'doe-2024-001',
        kg: 300,
        status: 'shipped' as const,
        shipped_at: 1717200000,
        received_at: 1717286400,
        notes: 'First shipment'
      };

      const result = DeliveryBatchUpsertSchema.safeParse(validBatch);
      expect(result.success).toBe(true);
    });

    it('should validate minimal delivery batch', () => {
      const minimalBatch = {
        id: 'batch-002',
        allocation_id: 'doe-2024-001',
        kg: 200,
        status: 'planned' as const
      };

      const result = DeliveryBatchUpsertSchema.safeParse(minimalBatch);
      expect(result.success).toBe(true);
    });

    it('should reject invalid delivery batches', () => {
      const invalidBatches = [
        { id: '', allocation_id: 'doe-001', kg: 100, status: 'planned' }, // Empty ID
        { id: 'batch-001', allocation_id: '', kg: 100, status: 'planned' }, // Empty allocation_id
        { id: 'batch-001', allocation_id: 'doe-001', kg: 0, status: 'planned' }, // Zero kg
        { id: 'batch-001', allocation_id: 'doe-001', kg: 100, status: 'invalid' }, // Invalid status
      ];

      invalidBatches.forEach((batch) => {
        const result = DeliveryBatchUpsertSchema.safeParse(batch);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('AllocationsBulkUpsertSchema', () => {
    it('should validate single allocation', () => {
      const singleAllocation = {
        id: 'doe-2024-001',
        allocated_to: 'X-energy',
        kg: 1200,
        status: 'confirmed' as const
      };

      const result = AllocationsBulkUpsertSchema.safeParse(singleAllocation);
      expect(result.success).toBe(true);
    });

    it('should validate allocation array', () => {
      const allocationArray = [
        {
          id: 'doe-2024-001',
          allocated_to: 'X-energy',
          kg: 1200,
          status: 'confirmed' as const
        },
        {
          id: 'doe-2024-002',
          allocated_to: 'TerraPower',
          kg: 850,
          status: 'conditional' as const
        }
      ];

      const result = AllocationsBulkUpsertSchema.safeParse(allocationArray);
      expect(result.success).toBe(true);
    });

    it('should validate bulk wrapper object', () => {
      const bulkWrapper = {
        items: [
          {
            id: 'doe-2024-001',
            allocated_to: 'X-energy',
            kg: 1200,
            status: 'confirmed' as const
          },
          {
            id: 'doe-2024-002',
            allocated_to: 'TerraPower',
            kg: 850,
            status: 'conditional' as const
          }
        ]
      };

      const result = AllocationsBulkUpsertSchema.safeParse(bulkWrapper);
      expect(result.success).toBe(true);
    });

    it('should reject invalid bulk data', () => {
      const invalidBulk = {
        items: [
          {
            id: 'doe-2024-001',
            allocated_to: 'X-energy',
            kg: 1200,
            status: 'confirmed' as const
          },
          {
            id: '', // Invalid item in array
            allocated_to: 'TerraPower',
            kg: 850,
            status: 'conditional' as const
          }
        ]
      };

      const result = AllocationsBulkUpsertSchema.safeParse(invalidBulk);
      expect(result.success).toBe(false);
    });
  });
});
