import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { RelationshipsService } from './relationships.service';

function createPrismaMock() {
  const prisma: any = {
    person: {
      findUnique: jest.fn(),
    },
    relationship: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };
  return prisma;
}

describe('RelationshipsService', () => {
  let service: RelationshipsService;
  let prisma: ReturnType<typeof createPrismaMock>;

  const tree = { id: 1, userId: 10 };

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new RelationshipsService(prisma as any);
  });

  describe('create() — validations', () => {
    it('rejects a relationship with oneself', async () => {
      await expect(
        service.create({ fromPersonId: 5, toPersonId: 5, type: 'spouse' }, 10),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.relationship.create).not.toHaveBeenCalled();
    });

    it('rejects when persons are in different trees', async () => {
      prisma.person.findUnique
        .mockResolvedValueOnce({ id: 1, treeId: 1, tree })
        .mockResolvedValueOnce({ id: 2, treeId: 2, tree: { id: 2, userId: 10 } });

      await expect(
        service.create({ fromPersonId: 1, toPersonId: 2, type: 'spouse' }, 10),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a duplicate relationship', async () => {
      prisma.person.findUnique
        .mockResolvedValueOnce({ id: 1, treeId: 1, tree })
        .mockResolvedValueOnce({ id: 2, treeId: 1, tree });
      prisma.relationship.findUnique.mockResolvedValue({ id: 99 });

      await expect(
        service.create({ fromPersonId: 1, toPersonId: 2, type: 'spouse' }, 10),
      ).rejects.toThrow(ConflictException);
    });

    it('throws NotFound when a person does not exist', async () => {
      prisma.person.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ fromPersonId: 1, toPersonId: 2, type: 'spouse' }, 10),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden when the person belongs to another user', async () => {
      prisma.person.findUnique.mockResolvedValue({ id: 1, treeId: 1, tree: { id: 1, userId: 99 } });

      await expect(
        service.create({ fromPersonId: 1, toPersonId: 2, type: 'spouse' }, 10),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('create() — cycle detection', () => {
    it('allows a valid parent relationship', async () => {
      prisma.person.findUnique
        .mockResolvedValueOnce({ id: 1, treeId: 1, tree })
        .mockResolvedValueOnce({ id: 2, treeId: 1, tree });
      prisma.relationship.findUnique.mockResolvedValue(null);
      // BFS from person 2: no relations → no cycle
      prisma.relationship.findMany.mockResolvedValue([]);
      prisma.relationship.create.mockResolvedValue({ id: 7, fromPersonId: 1, toPersonId: 2, type: 'parent' });

      const result = await service.create({ fromPersonId: 1, toPersonId: 2, type: 'parent' }, 10);

      expect(result.id).toBe(7);
      expect(prisma.relationship.create).toHaveBeenCalled();
    });

    it('rejects a parent relationship that would create a cycle', async () => {
      prisma.person.findUnique
        .mockResolvedValueOnce({ id: 1, treeId: 1, tree })
        .mockResolvedValueOnce({ id: 2, treeId: 1, tree });
      prisma.relationship.findUnique.mockResolvedValue(null);
      // Making person 1 a parent of 2, but 2 is already an ancestor of 1:
      // BFS from 2 finds 2 → 3 (parent), 3 → 1 (parent) → reaches 1 → cycle!
      const rels = [
        { fromPersonId: 2, toPersonId: 3, type: 'parent' },
        { fromPersonId: 3, toPersonId: 1, type: 'parent' },
      ];
      prisma.relationship.findMany.mockImplementation(({ where }) => {
        const from = where.fromPersonId;
        return rels.filter((r) => r.fromPersonId === from);
      });

      await expect(
        service.create({ fromPersonId: 1, toPersonId: 2, type: 'parent' }, 10),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.relationship.create).not.toHaveBeenCalled();
    });

    it('rejects a child relationship that would create a cycle (reverse check)', async () => {
      prisma.person.findUnique
        .mockResolvedValueOnce({ id: 1, treeId: 1, tree })
        .mockResolvedValueOnce({ id: 2, treeId: 1, tree });
      prisma.relationship.findUnique.mockResolvedValue(null);
      // Adding child: 1 is child of 2, but 2 is already a descendant of 1
      // wouldCreateCycle(toPersonId=2, fromPersonId=1) → BFS from 1 finds 1→2 → cycle
      const rels = [{ fromPersonId: 1, toPersonId: 2, type: 'parent' }];
      prisma.relationship.findMany.mockImplementation(({ where }) => {
        const from = where.fromPersonId;
        return rels.filter((r) => r.fromPersonId === from);
      });

      await expect(
        service.create({ fromPersonId: 1, toPersonId: 2, type: 'child' }, 10),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove()', () => {
    it('deletes a relationship the user owns', async () => {
      prisma.relationship.findUnique.mockResolvedValue({
        id: 7,
        fromPerson: { tree: { userId: 10 } },
      });
      prisma.relationship.delete.mockResolvedValue({ id: 7 });

      const result = await service.remove(7, 10);

      expect(result.id).toBe(7);
      expect(prisma.relationship.delete).toHaveBeenCalledWith({ where: { id: 7 } });
    });

    it('throws NotFound when relationship does not exist', async () => {
      prisma.relationship.findUnique.mockResolvedValue(null);

      await expect(service.remove(999, 10)).rejects.toThrow(NotFoundException);
    });

    it('throws Forbidden when relationship belongs to another user', async () => {
      prisma.relationship.findUnique.mockResolvedValue({
        id: 7,
        fromPerson: { tree: { userId: 99 } },
      });

      await expect(service.remove(7, 10)).rejects.toThrow(ForbiddenException);
    });
  });
});
