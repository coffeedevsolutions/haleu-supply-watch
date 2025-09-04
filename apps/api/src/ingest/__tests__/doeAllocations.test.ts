import { describe, it, expect } from 'vitest';

// Test utilities for the DOE allocations ingest logic
describe('DOE Allocations Ingest', () => {
  // Test CSV parsing
  describe('CSV parsing', () => {
    it('should parse basic CSV format', () => {
      const csvContent = `id,allocated_to,kg,status,allocation_date,delivery_window_start,delivery_window_end,notes
doe-001,X-energy,1200,confirmed,1704067200,1735689600,1767225600,Test allocation
doe-002,TerraPower,850,conditional,,,,"Multiple,comma,notes"`;

      // Simple CSV parser test
      const lines = csvContent.trim().split('\n');
      const headers = lines[0].split(',');
      const record1 = lines[1].split(',');
      const record2 = lines[2].split(',');

      expect(headers).toEqual([
        'id', 'allocated_to', 'kg', 'status', 'allocation_date', 
        'delivery_window_start', 'delivery_window_end', 'notes'
      ]);
      expect(record1[0]).toBe('doe-001');
      expect(record1[1]).toBe('X-energy');
      expect(parseFloat(record1[2])).toBe(1200);
      expect(record1[3]).toBe('confirmed');
    });

    it('should handle empty values', () => {
      const csvContent = `id,allocated_to,kg,status
doe-001,X-energy,1200,confirmed
doe-002,TerraPower,,conditional`;

      const lines = csvContent.trim().split('\n');
      const record2 = lines[2].split(',');
      
      expect(record2[2]).toBe(''); // Empty kg field
      expect(record2[3]).toBe('conditional');
    });
  });

  // Test diff calculation logic
  describe('Diff calculation', () => {
    interface MockRecord {
      id: string;
      allocated_to: string;
      kg: number;
      status: string;
    }

    const calculateMockDiff = (oldRecords: MockRecord[], newRecords: MockRecord[]) => {
      const oldMap = new Map(oldRecords.map(r => [r.id, r]));
      const newMap = new Map(newRecords.map(r => [r.id, r]));
      
      const added: MockRecord[] = [];
      const changed: Array<{ old: MockRecord; new: MockRecord; changes: string[] }> = [];
      const removed: MockRecord[] = [];
      
      // Find added and changed
      for (const [id, newRecord] of newMap) {
        const oldRecord = oldMap.get(id);
        if (!oldRecord) {
          added.push(newRecord);
        } else {
          const changes: string[] = [];
          if (oldRecord.allocated_to !== newRecord.allocated_to) {
            changes.push('allocated_to');
          }
          if (oldRecord.kg !== newRecord.kg) {
            changes.push('kg');
          }
          if (oldRecord.status !== newRecord.status) {
            changes.push('status');
          }
          if (changes.length > 0) {
            changed.push({ old: oldRecord, new: newRecord, changes });
          }
        }
      }
      
      // Find removed
      for (const [id, oldRecord] of oldMap) {
        if (!newMap.has(id)) {
          removed.push(oldRecord);
        }
      }
      
      return { added, changed, removed };
    };

    it('should detect added records', () => {
      const oldRecords: MockRecord[] = [
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200, status: 'confirmed' }
      ];
      const newRecords: MockRecord[] = [
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200, status: 'confirmed' },
        { id: 'doe-002', allocated_to: 'TerraPower', kg: 850, status: 'conditional' }
      ];

      const diff = calculateMockDiff(oldRecords, newRecords);
      
      expect(diff.added).toHaveLength(1);
      expect(diff.added[0].id).toBe('doe-002');
      expect(diff.changed).toHaveLength(0);
      expect(diff.removed).toHaveLength(0);
    });

    it('should detect changed records', () => {
      const oldRecords: MockRecord[] = [
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200, status: 'conditional' }
      ];
      const newRecords: MockRecord[] = [
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200, status: 'confirmed' }
      ];

      const diff = calculateMockDiff(oldRecords, newRecords);
      
      expect(diff.added).toHaveLength(0);
      expect(diff.changed).toHaveLength(1);
      expect(diff.changed[0].changes).toContain('status');
      expect(diff.removed).toHaveLength(0);
    });

    it('should detect removed records', () => {
      const oldRecords: MockRecord[] = [
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200, status: 'confirmed' },
        { id: 'doe-002', allocated_to: 'TerraPower', kg: 850, status: 'conditional' }
      ];
      const newRecords: MockRecord[] = [
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200, status: 'confirmed' }
      ];

      const diff = calculateMockDiff(oldRecords, newRecords);
      
      expect(diff.added).toHaveLength(0);
      expect(diff.changed).toHaveLength(0);
      expect(diff.removed).toHaveLength(1);
      expect(diff.removed[0].id).toBe('doe-002');
    });

    it('should handle multiple changes', () => {
      const oldRecords: MockRecord[] = [
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200, status: 'conditional' }
      ];
      const newRecords: MockRecord[] = [
        { id: 'doe-001', allocated_to: 'X-energy Consortium', kg: 1500, status: 'confirmed' }
      ];

      const diff = calculateMockDiff(oldRecords, newRecords);
      
      expect(diff.changed).toHaveLength(1);
      expect(diff.changed[0].changes).toContain('allocated_to');
      expect(diff.changed[0].changes).toContain('kg');
      expect(diff.changed[0].changes).toContain('status');
    });
  });

  // Test validation logic
  describe('Data validation', () => {
    it('should validate required fields', () => {
      const validRecord = {
        id: 'doe-001',
        allocated_to: 'X-energy',
        kg: 1200,
        status: 'confirmed'
      };

      expect(validRecord.id).toBeTruthy();
      expect(validRecord.allocated_to).toBeTruthy();
      expect(validRecord.kg).toBeGreaterThan(0);
      expect(['conditional', 'confirmed']).toContain(validRecord.status);
    });

    it('should reject invalid records', () => {
      const invalidRecords = [
        { id: '', allocated_to: 'X-energy', kg: 1200, status: 'confirmed' }, // Empty ID
        { id: 'doe-001', allocated_to: '', kg: 1200, status: 'confirmed' }, // Empty allocated_to
        { id: 'doe-001', allocated_to: 'X-energy', kg: 0, status: 'confirmed' }, // Zero kg
        { id: 'doe-001', allocated_to: 'X-energy', kg: -100, status: 'confirmed' }, // Negative kg
        { id: 'doe-001', allocated_to: 'X-energy', kg: 1200, status: 'invalid' }, // Invalid status
      ];

      invalidRecords.forEach((record, index) => {
        const hasValidId = record.id && record.id.length > 0;
        const hasValidAllocatedTo = record.allocated_to && record.allocated_to.length > 0;
        const hasValidKg = record.kg > 0;
        const hasValidStatus = ['conditional', 'confirmed'].includes(record.status);
        
        const isValid = hasValidId && hasValidAllocatedTo && hasValidKg && hasValidStatus;
        expect(isValid).toBe(false); // Each record should be invalid
      });
    });
  });
});
