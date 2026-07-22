import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTreeDto, UpdateTreeDto } from './dto/tree.dto';

@Injectable()
export class TreesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTreeDto, userId: number) {
    return this.prisma.tree.create({
      data: { name: dto.name, userId },
    });
  }

  async findAll(userId: number) {
    return this.prisma.tree.findMany({ where: { userId } });
  }

  async findOne(id: number, userId: number) {
    const tree = await this.prisma.tree.findUnique({ where: { id } });
    if (!tree) throw new NotFoundException('Tree not found');
    if (tree.userId !== userId) throw new ForbiddenException();
    return tree;
  }

  async update(id: number, dto: UpdateTreeDto, userId: number) {
    await this.findOne(id, userId);
    return this.prisma.tree.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number) {
    await this.findOne(id, userId);
    return this.prisma.tree.delete({ where: { id } });
  }

  async getGraph(id: number, userId: number) {
    const tree = await this.findOne(id, userId);
    const persons = await this.prisma.person.findMany({ where: { treeId: id } });
    const edges = await this.prisma.relationship.findMany({
      where: {
        OR: [
          { fromPerson: { treeId: id } },
        ],
      },
      include: {
        fromPerson: { select: { id: true, name: true, treeId: true } },
        toPerson: { select: { id: true, name: true, treeId: true } },
      },
    });

    // Only include edges where both persons belong to this tree
    const personIds = new Set(persons.map(p => p.id));
    const validEdges = edges.filter(
      e => personIds.has(e.fromPersonId) && personIds.has(e.toPersonId),
    );

    return {
      tree,
      nodes: persons.map(p => ({
        id: p.id,
        name: p.name,
        gender: p.gender,
        birthDate: p.birthDate,
        photo: p.photo,
        notes: p.notes,
      })),
      edges: validEdges.map(e => ({
        id: e.id,
        from: e.fromPersonId,
        to: e.toPersonId,
        type: e.type,
        fromName: e.fromPerson.name,
        toName: e.toPerson.name,
      })),
    };
  }
}
