import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PersonsService } from './persons.service';

/**
 * Prisma mock factory — each call records the query so tests can assert
 * exactly what was sent to the database.
 */
function createPrismaMock() {
  const calls: { method: string; args: any }[] = [];
  const prisma: any = {
    _calls: calls,
    person: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      deleteMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    relationship: {
      findMany: jest.fn(),
    },
    tree: {
      findUnique: jest.fn(),
    },
  };
  return prisma;
}

describe('PersonsService — cascade delete', () => {
  let service: PersonsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const tree = { id: 1, userId: 10 };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new PersonsService(prisma as any);
  });

  describe('remove()', () => {
    it('deletes the person itself', async () => {
      prisma.person.findUnique.mockResolvedValue({ id: 5, treeId: 1, tree });
      prisma.relationship.findMany.mockResolvedValue([]);

      const result = await service.remove(5, 10);

      expect(result.deleted).toBe(1);
      expect(result.ids).toEqual([5]);
      expect(prisma.person.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [5] } },
      });
    });

    it('cascades to children (child relationship stored as from=child, to=parent)', async () => {
      prisma.person.findUnique.mockResolvedValue({ id: 1, treeId: 1, tree });
      // Person 1 is the parent of 2 and 3; 3 is the parent of 4
      const rels = [
        { fromPersonId: 2, toPersonId: 1, type: 'child' },
        { fromPersonId: 3, toPersonId: 1, type: 'child' },
        { fromPersonId: 4, toPersonId: 3, type: 'child' },
      ];
      prisma.relationship.findMany.mockImplementation(({ where }) => {
        const current = where.OR[0].fromPersonId;
        return rels.filter(
          (r) => r.fromPersonId === current || r.toPersonId === current,
        );
      });

      const result = await service.remove(1, 10);

      expect(result.deleted).toBe(4);
      expect(result.ids.sort((a, b) => a - b)).toEqual([1, 2, 3, 4]);
    });

    it('never walks UP to parents', async () => {
      prisma.person.findUnique.mockResolvedValue({ id: 2, treeId: 1, tree });
      // Person 2 is a child of person 1 (from=2, to=1) — parent must NOT be deleted
      prisma.relationship.findMany
        .mockResolvedValueOnce([{ fromPersonId: 2, toPersonId: 1, type: 'child' }])
        .mockResolvedValueOnce([]);

      const result = await service.remove(2, 10);

      expect(result.ids).toEqual([2]);
      expect(result.ids).not.toContain(1);
    });

    it('keeps couples whole (spouse is deleted too)', async () => {
      prisma.person.findUnique.mockResolvedValue({ id: 1, treeId: 1, tree });
      prisma.relationship.findMany
        .mockResolvedValueOnce([
          { fromPersonId: 1, toPersonId: 7, type: 'spouse' },
        ])
        .mockResolvedValueOnce([
          { fromPersonId: 1, toPersonId: 7, type: 'spouse' },
        ]);

      const result = await service.remove(1, 10);

      expect(result.ids.sort((a, b) => a - b)).toEqual([1, 7]);
    });

    it('handles parent-typed relationships (stored as from=parent, to=child)', async () => {
      prisma.person.findUnique.mockResolvedValue({ id: 9, treeId: 1, tree });
      // Person 9 is the parent of 10 (stored as parent type)
      prisma.relationship.findMany
        .mockResolvedValueOnce([{ fromPersonId: 9, toPersonId: 10, type: 'parent' }])
        .mockResolvedValueOnce([]);

      const result = await service.remove(9, 10);

      expect(result.ids.sort((a, b) => a - b)).toEqual([9, 10]);
    });

    it('throws NotFoundException when person does not exist', async () => {
      prisma.person.findUnique.mockResolvedValue(null);

      await expect(service.remove(999, 10)).rejects.toThrow(NotFoundException);
      expect(prisma.person.deleteMany).not.toHaveBeenCalled();
    });

    it('throws ForbiddenException for another user\'s tree', async () => {
      prisma.person.findUnique.mockResolvedValue({ id: 5, treeId: 1, tree: { id: 1, userId: 99 } });

      await expect(service.remove(5, 10)).rejects.toThrow(ForbiddenException);
      expect(prisma.person.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('removeBatch()', () => {
    it('deletes a couple plus their children', async () => {
      // Both spouses belong to the same user
      prisma.person.findMany.mockResolvedValue([
        { id: 1, treeId: 1, tree },
        { id: 2, treeId: 1, tree },
      ]);
      const rels = [
        { fromPersonId: 1, toPersonId: 2, type: 'spouse' },
        { fromPersonId: 3, toPersonId: 1, type: 'child' },
        { fromPersonId: 3, toPersonId: 2, type: 'child' },
      ];
      prisma.relationship.findMany.mockImplementation(({ where }) => {
        const current = where.OR[0].fromPersonId;
        return rels.filter(
          (r) => r.fromPersonId === current || r.toPersonId === current,
        );
      });

      const result = await service.removeBatch([1, 2], 10);

      expect(result.deleted).toBe(3);
      expect(result.ids.sort((a, b) => a - b)).toEqual([1, 2, 3]);
    });

    it('rejects if any person belongs to another user', async () => {
      prisma.person.findMany.mockResolvedValue([
        { id: 1, treeId: 1, tree },
        { id: 2, treeId: 2, tree: { id: 2, userId: 99 } },
      ]);

      await expect(service.removeBatch([1, 2], 10)).rejects.toThrow(ForbiddenException);
      expect(prisma.person.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('create()', () => {
    it('creates a person in the user\'s tree', async () => {
      prisma.tree.findUnique.mockResolvedValue(tree);
      prisma.person.create.mockResolvedValue({ id: 11, name: 'Test' });

      const result = await service.create({ name: 'Test', gender: 'male', treeId: 1 }, 10);

      expect(result.id).toBe(11);
      expect(prisma.person.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ name: 'Test', treeId: 1 }),
      });
    });

    it('throws ForbiddenException for another user\'s tree', async () => {
      prisma.tree.findUnique.mockResolvedValue({ id: 1, userId: 99 });

      await expect(
        service.create({ name: 'Test', treeId: 1 }, 10),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
