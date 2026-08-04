import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonDto, UpdatePersonDto } from './dto/person.dto';

@Injectable()
export class PersonsService {
  constructor(private prisma: PrismaService) {}

  private async verifyTreeOwnership(treeId: number, userId: number) {
    const tree = await this.prisma.tree.findUnique({ where: { id: treeId } });
    if (!tree) throw new NotFoundException('Tree not found');
    if (tree.userId !== userId) throw new ForbiddenException();
  }

  async create(dto: CreatePersonDto, userId: number) {
    const treeId = dto.treeId;
    await this.verifyTreeOwnership(treeId, userId);
    return this.prisma.person.create({
      data: {
        name: dto.name,
        gender: dto.gender,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        photo: dto.photo,
        notes: dto.notes,
        treeId,
      },
    });
  }

  async findByTree(treeId: number, userId: number) {
    await this.verifyTreeOwnership(treeId, userId);
    return this.prisma.person.findMany({ where: { treeId } });
  }

  async findOne(id: number, userId: number) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: { tree: true },
    });
    if (!person) throw new NotFoundException('Person not found');
    if (person.tree.userId !== userId) throw new ForbiddenException();
    return person;
  }

  async update(id: number, dto: UpdatePersonDto, userId: number) {
    await this.findOne(id, userId);
    const data: any = { ...dto };
    if (dto.birthDate) data.birthDate = new Date(dto.birthDate);
    return this.prisma.person.update({ where: { id }, data });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    const toDelete = await this.collectCascadeIds([id], userId);
    await this.prisma.person.deleteMany({ where: { id: { in: toDelete } } });
    return { deleted: toDelete.length, ids: toDelete };
  }

  // Batch delete for couple nodes — cascade deletes the whole branch
  async removeBatch(ids: number[], userId: number) {
    const persons = await this.prisma.person.findMany({
      where: { id: { in: ids } },
      include: { tree: true },
    });
    for (const p of persons) {
      if (p.tree.userId !== userId) throw new ForbiddenException();
    }
    const toDelete = await this.collectCascadeIds(ids, userId);
    await this.prisma.person.deleteMany({ where: { id: { in: toDelete } } });
    return { deleted: toDelete.length, ids: toDelete };
  }

  // Returns the ids of a person + all descendants + their spouses
  // (so no orphaned nodes remain after deletion). Never walks UP to parents.
  private async collectCascadeIds(seedIds: number[], userId: number): Promise<number[]> {
    const set = new Set<number>(seedIds);
    const queue = [...seedIds];
    while (queue.length) {
      const current = queue.pop()!;
      const rels = await this.prisma.relationship.findMany({
        where: {
          OR: [{ fromPersonId: current }, { toPersonId: current }],
        },
        select: { fromPersonId: true, toPersonId: true, type: true },
      });
      for (const r of rels) {
        const other = r.fromPersonId === current ? r.toPersonId : r.fromPersonId;
        if (set.has(other)) continue;
        let include = false;
        if (r.type === 'spouse') {
          include = true; // keep couples whole
        } else if (r.type === 'child') {
          // stored as from=child, to=parent → cascade only when current IS the parent
          include = r.toPersonId === current;
        } else if (r.type === 'parent') {
          // stored as from=parent, to=child → cascade only when current IS the parent
          include = r.fromPersonId === current;
        }
        if (include) {
          set.add(other);
          queue.push(other);
        }
      }
    }
    return [...set];
  }
}
