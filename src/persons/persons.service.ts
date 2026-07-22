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
    const treeId = dto.treeId!;
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
    return this.prisma.person.delete({ where: { id } });
  }
}
