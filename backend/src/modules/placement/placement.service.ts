import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { JobApplicationStatus, Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';
import { AuthUser } from '../../common/interfaces/auth-user.interface';

const DRIVE_INCLUDE = {
  company: true,
  applications: { select: { status: true, studentId: true } },
} satisfies Prisma.PlacementDriveInclude;

type DriveRow = Prisma.PlacementDriveGetPayload<{ include: typeof DRIVE_INCLUDE }>;

const SHORTLISTED_OR_BEYOND: JobApplicationStatus[] = [
  JobApplicationStatus.SHORTLISTED,
  JobApplicationStatus.INTERVIEW_SCHEDULED,
  JobApplicationStatus.OFFERED,
];

@Injectable()
export class PlacementService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: AuthUser) {
    const drives = await this.prisma.placementDrive.findMany({ include: DRIVE_INCLUDE, orderBy: { deadline: 'asc' } });
    return drives.map((d) => this.toDriveView(d, user));
  }

  async findById(id: string, user: AuthUser) {
    const drive = await this.prisma.placementDrive.findUnique({ where: { id }, include: DRIVE_INCLUDE });
    if (!drive) throw new NotFoundException(`Placement drive ${id} not found.`);
    return this.toDriveView(drive, user);
  }

  /** Students see only their own applications; placement staff see all. */
  async getApplications(user: AuthUser) {
    const apps = await this.prisma.jobApplication.findMany({
      where: user.role === UserRole.STUDENT ? { studentId: user.studentId ?? '__none__' } : {},
      include: {
        drive: { include: { company: true } },
        student: { include: { user: { select: { name: true } }, department: { select: { name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return apps.map((a) => ({
      id: a.id,
      studentId: a.studentId,
      studentName: a.student.user.name,
      rollNumber: a.student.rollNumber,
      driveId: a.driveId,
      companyName: a.drive.company.name,
      roleTitle: a.drive.role,
      cgpa: a.student.cgpa,
      branch: a.student.department.name,
      status: a.status,
      offerCtc: a.offeredCtc,
      loiSigned: a.loiAccepted,
      loiSignedAt: a.loiSignedAt,
      appliedAt: a.createdAt,
    }));
  }

  /** Applies after checking the drive is open and the student meets the CGPA cut-off. */
  async applyToDrive(driveId: string, studentId: string) {
    const [drive, student] = await Promise.all([
      this.prisma.placementDrive.findUnique({ where: { id: driveId }, include: { company: true } }),
      this.prisma.student.findUnique({ where: { id: studentId } }),
    ]);
    if (!drive) throw new NotFoundException(`Placement drive ${driveId} not found.`);
    if (!student) throw new NotFoundException('Student profile not found.');

    if (drive.status !== 'ACTIVE' || drive.deadline < new Date()) {
      throw new BadRequestException('Applications for this drive are closed.');
    }
    if (student.cgpa < drive.minCgpa) {
      throw new BadRequestException(`This drive requires a minimum CGPA of ${drive.minCgpa}; yours is ${student.cgpa}.`);
    }
    if (student.isDebarred) {
      throw new BadRequestException('Debarred students cannot apply to placement drives.');
    }

    try {
      const application = await this.prisma.jobApplication.create({ data: { driveId, studentId } });
      return {
        success: true,
        applicationId: application.id,
        message: `Application submitted to ${drive.company.name}.`,
        appliedAt: application.createdAt.toISOString(),
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('You have already applied to this drive.');
      }
      throw err;
    }
  }

  /** Accepts the Letter of Intent on the caller's own OFFERED application. */
  async signLoi(applicationId: string, studentId: string) {
    const application = await this.prisma.jobApplication.findUnique({ where: { id: applicationId } });
    if (!application) throw new NotFoundException('Application not found.');
    if (application.studentId !== studentId) throw new ForbiddenException('You can only sign your own offer letters.');
    if (application.status !== JobApplicationStatus.OFFERED) {
      throw new BadRequestException('A Letter of Intent can only be signed for an offered position.');
    }
    if (application.loiAccepted) throw new ConflictException('This Letter of Intent has already been signed.');

    const signed = await this.prisma.jobApplication.update({
      where: { id: applicationId },
      data: { loiAccepted: true, loiSignedAt: new Date() },
    });
    return { success: true, applicationId: signed.id, signedAt: signed.loiSignedAt!.toISOString() };
  }

  private toDriveView(d: DriveRow, user: AuthUser) {
    const myApplication = user.studentId ? d.applications.find((a) => a.studentId === user.studentId) : undefined;
    const isOpen = d.status === 'ACTIVE' && d.deadline >= new Date();
    return {
      id: d.id,
      companyName: d.company.name,
      companyLogo: d.company.logoUrl,
      industry: d.company.industry,
      roleTitle: d.role,
      ctc: d.ctc,
      location: d.location,
      deadline: d.deadline.toISOString(),
      minCgpa: d.minCgpa,
      maxBacklogsAllowed: d.maxBacklogs,
      allowedBatches: d.allowedBatches,
      status: isOpen ? ('LIVE' as const) : ('CLOSED' as const),
      registeredCount: d.applications.length,
      shortlistedCount: d.applications.filter((a) => SHORTLISTED_OR_BEYOND.includes(a.status)).length,
      offersCount: d.applications.filter((a) => a.status === JobApplicationStatus.OFFERED).length,
      myApplicationStatus: myApplication?.status ?? null,
    };
  }
}
