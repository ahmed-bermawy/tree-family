import {
  Injectable, NotFoundException, ForbiddenException,
  BadRequestException, ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRelationshipDto } from './dto/relationship.dto';

@Injectable()
export class RelationshipsService {
  constructor(private prisma: PrismaService) {}

  private async verifyPersonOwnership(personId: number, userId: number) {
    const person = await this.prisma.person.findUnique({
      where: { id: personId },
      include: { tree: true },
    });
    if (!person) throw new NotFoundException(`Person ${personId} not found`);
    if (person.tree.userId !== userId) throw new ForbiddenException();
    return person;
  }

  async create(dto: CreateRelationshipDto, userId: number) {
    const { fromPersonId, toPersonId, type } = dto;

    // No self-relations
    if (fromPersonId === toPersonId) {
      throw new BadRequestException('Cannot create a relationship with oneself');
    }

    // Verify both persons exist and are in the same tree owned by user
    const fromPerson = await this.verifyPersonOwnership(fromPersonId, userId);
    const toPerson = await this.verifyPersonOwnership(toPersonId, userId);

    if (fromPerson.treeId !== toPerson.treeId) {
      throw new BadRequestException('Persons must be in the same tree');
    }

    // Check for duplicate relationship
    const existing = await this.prisma.relationship.findUnique({
      where: { fromPersonId_toPersonId_type: { fromPersonId, toPersonId, type } },
    });
    if (existing) {
      throw new ConflictException('Relationship already exists');
    }

    // Cycle detection for parent-child
    if (type === 'parent') {
      if (await this.wouldCreateCycle(fromPersonId, toPersonId)) {
        throw new BadRequestException('This relationship would create a cycle');
      }
    }
    // Also check reverse parent relationship
    if (type === 'child') {
      if (await this.wouldCreateCycle(toPersonId, fromPersonId)) {
        throw new BadRequestException('This relationship would create a cycle');
      }
    }

    return this.prisma.relationship.create({
      data: { fromPersonId, toPersonId, type },
      include: {
        fromPerson: { select: { id: true, name: true } },
        toPerson: { select: { id: true, name: true } },
      },
    });
  }

  async remove(id: number, userId: number) {
    const rel = await this.prisma.relationship.findUnique({
      where: { id },
      include: {
        fromPerson: { include: { tree: true } },
      },
    });
    if (!rel) throw new NotFoundException('Relationship not found');
    if (rel.fromPerson.tree.userId !== userId) throw new ForbiddenException();
    return this.prisma.relationship.delete({ where: { id } });
  }

  private async wouldCreateCycle(
    fromPersonId: number,
    toPersonId: number,
  ): Promise<boolean> {
    // BFS from toPersonId following parent/child relationships
    // If we reach fromPersonId, a cycle would be created
    const visited = new Set<number>();
    const queue = [toPersonId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === fromPersonId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      // Follow "child" relations (current is parent of these)
      const childRels = await this.prisma.relationship.findMany({
        where: {
          fromPersonId: current,
          type: 'parent',
        },
        select: { toPersonId: true },
      });

      // Follow "parent" relations (current is child of these)
      const parentRels = await this.prisma.relationship.findMany({
        where: {
          toPersonId: current,
          type: 'child',
        },
        select: { fromPersonId: true },
      });

      for (const r of childRels) queue.push(r.toPersonId);
      for (const r of parentRels) queue.push(r.fromPersonId);

      // Also follow reverse: if current is child of someone
      const revChildRels = await this.prisma.relationship.findMany({
        where: {
          toPersonId: current,
          type: 'parent',
        },
        select: { fromPersonId: true },
      });
      const revParentRels = await this.prisma.relationship.findMany({
        where: {
          fromPersonId: current,
          type: 'child',
        },
        select: { toPersonId: true },
      });

      for (const r of revChildRels) queue.push(r.fromPersonId);
      for (const r of revParentRels) queue.push(r.toPersonId);
    }

    return false;
  }
}
