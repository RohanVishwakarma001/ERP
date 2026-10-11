import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_MATERIALS = [
  {
    id: 'mat-01',
    subjectCode: 'CS-601',
    subjectName: 'Compiler Design',
    title: 'Unit 2: LR Parsing Tables & Yacc Implementation Guide',
    fileType: 'PDF',
    fileSize: '3.4 MB',
    fileUrl: 'https://storage.jbitdoon.edu.in/materials/unit2-parsing.pdf',
    uploadedBy: 'Dr. V. K. Bhatt',
    uploadedAt: '2026-05-15',
  },
  {
    id: 'mat-02',
    subjectCode: 'CS-602',
    subjectName: 'Cloud Computing & DevOps',
    title: 'Kubernetes Cluster Architecture & Helm Chart Templates',
    fileType: 'ZIP',
    fileSize: '12.8 MB',
    fileUrl: 'https://storage.jbitdoon.edu.in/materials/k8s-helm.zip',
    uploadedBy: 'Prof. Ananya Sen',
    uploadedAt: '2026-05-18',
  },
];

@Injectable()
export class MaterialsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return MOCK_MATERIALS;
  }
}
