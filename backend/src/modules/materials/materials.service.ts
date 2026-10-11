import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll(subjectCode?: string) {
    const materials = await this.prisma.studyMaterial.findMany({
      where: subjectCode ? { subject: { code: subjectCode } } : {},
      include: { subject: { select: { code: true, name: true } }, faculty: { include: { user: { select: { name: true } } } } },
      orderBy: { createdAt: 'desc' },
    });

    return materials.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      subjectCode: m.subject.code,
      subjectName: m.subject.name,
      uploadedBy: m.faculty.user.name,
      fileUrl: m.fileUrl,
      fileType: m.fileType,
      fileSizeBytes: m.fileSize,
      uploadedAt: m.createdAt.toISOString(),
    }));
  }
}
