import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const MOCK_FACULTY = [
  {
    id: 'fac-01',
    employeeCode: 'FAC-CSE-001',
    name: 'Dr. V. K. Bhatt',
    email: 'hod.cse@jbitdoon.edu.in',
    department: 'Computer Science & Engineering',
    designation: 'Professor & Head of Department',
    qualification: 'Ph.D. in Distributed Computing (IIT Roorkee)',
    aicteComplianceHours: 18.0,
    specialization: 'Distributed Systems & Blockchain',
    assignedClasses: [
      { period: 1, time: '09:00 - 10:00 AM', code: 'CS-601', name: 'Compiler Design', section: 'CSE-6A', room: 'LH-302' },
      { period: 2, time: '10:15 - 11:15 AM', code: 'CS-801', name: 'Distributed Systems', section: 'CSE-8B', room: 'Audi-02' },
      { period: 4, time: '01:30 - 02:30 PM', code: 'CS-402', name: 'Theory of Computation', section: 'CSE-4A', room: 'LH-101' },
    ],
  },
  {
    id: 'fac-02',
    employeeCode: 'FAC-CSE-004',
    name: 'Prof. Ananya Sen',
    email: 'ananya.sen@jbitdoon.edu.in',
    department: 'Computer Science & Engineering',
    designation: 'Assistant Professor (Senior Scale)',
    qualification: 'M.Tech CSE (NIT Kurukshetra)',
    aicteComplianceHours: 18.0,
    specialization: 'Cloud Computing & DevOps',
    assignedClasses: [
      { period: 2, time: '10:15 - 11:15 AM', code: 'CS-602', name: 'Cloud Computing', section: 'CSE-6A', room: 'Lab-401' },
    ],
  },
];

@Injectable()
export class FacultyService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (this.prisma.isConnected) {
      try {
        const facultyList = await this.prisma.faculty.findMany({
          include: {
            user: true,
            department: true,
            timetableEntries: {
              include: {
                subject: true,
                room: true,
                section: true,
              },
            },
          },
          orderBy: { employeeCode: 'asc' },
        });

        if (facultyList && facultyList.length > 0) {
          return facultyList.map((f) => {
            const classes = f.timetableEntries.map((t) => ({
              period: t.period,
              time: `${t.startTime} - ${t.endTime}`,
              code: t.subject.code,
              name: t.subject.name,
              section: t.section.name,
              room: t.room.roomNumber,
            }));

            const assignedSubsMap = new Map<string, any>();
            for (const t of f.timetableEntries) {
              assignedSubsMap.set(t.subject.code, {
                code: t.subject.code,
                name: t.subject.name,
                semester: t.subject.semester,
                section: t.section.name,
              });
            }

            return {
              id: f.id,
              employeeId: f.employeeCode,
              name: f.user.name,
              email: f.user.email,
              phone: f.user.phone || '+91 98765 12345',
              department: f.department.name,
              designation: f.designation,
              qualification: f.qualification,
              specialization: f.specialization || 'Distributed Systems & AI',
              weeklyWorkloadHours: f.aicteComplianceHours || 18.0,
              maxWorkloadHours: 20,
              activePeriodsCount: classes.length,
              assignedSubjects: Array.from(assignedSubsMap.values()),
              avatarUrl: f.user.avatarUrl || '/assets/faculty-avatar.png',
              status: 'ACTIVE' as const,
            };
          });
        }
      } catch {
        // Fallback
      }
    }

    return MOCK_FACULTY.map((f) => ({
      id: f.id,
      employeeId: f.employeeCode,
      name: f.name,
      email: f.email,
      phone: '+91 98765 12345',
      department: f.department,
      designation: f.designation,
      qualification: f.qualification,
      specialization: f.specialization,
      weeklyWorkloadHours: f.aicteComplianceHours,
      maxWorkloadHours: 20,
      activePeriodsCount: f.assignedClasses.length,
      assignedSubjects: f.assignedClasses.map((c) => ({
        code: c.code,
        name: c.name,
        semester: 6,
        section: c.section,
      })),
      avatarUrl: '/assets/faculty-avatar.png',
      status: 'ACTIVE' as const,
    }));
  }

  async findById(id: string) {
    if (this.prisma.isConnected) {
      try {
        const f = await this.prisma.faculty.findFirst({
          where: { OR: [{ id }, { employeeCode: id }] },
          include: {
            user: true,
            department: true,
            timetableEntries: {
              include: {
                subject: true,
                room: true,
                section: true,
              },
            },
          },
        });

        if (f) {
          const classes = f.timetableEntries.map((t) => ({
            period: t.period,
            time: `${t.startTime} - ${t.endTime}`,
            code: t.subject.code,
            name: t.subject.name,
            section: t.section.name,
            room: t.room.roomNumber,
          }));

          return {
            id: f.id,
            employeeId: f.employeeCode,
            name: f.user.name,
            email: f.user.email,
            phone: f.user.phone || '+91 98765 12345',
            department: f.department.name,
            designation: f.designation,
            qualification: f.qualification,
            specialization: f.specialization || 'Distributed Systems & Cloud',
            weeklyWorkloadHours: f.aicteComplianceHours || 18.0,
            maxWorkloadHours: 20,
            activePeriodsCount: classes.length,
            assignedClasses: classes,
            assignedSubjects: classes.map((c) => ({
              code: c.code,
              name: c.name,
              semester: 6,
              section: c.section,
            })),
            avatarUrl: f.user.avatarUrl || '/assets/faculty-avatar.png',
            status: 'ACTIVE' as const,
          };
        }
      } catch {
        // Fallback
      }
    }

    const fac = MOCK_FACULTY.find((f) => f.id === id || f.employeeCode === id);
    if (!fac) throw new NotFoundException(`Faculty member ${id} not found`);
    return {
      ...fac,
      employeeId: fac.employeeCode,
      phone: '+91 98765 12345',
      weeklyWorkloadHours: fac.aicteComplianceHours,
      maxWorkloadHours: 20,
      activePeriodsCount: fac.assignedClasses.length,
      assignedSubjects: fac.assignedClasses.map((c) => ({
        code: c.code,
        name: c.name,
        semester: 6,
        section: c.section,
      })),
      avatarUrl: '/assets/faculty-avatar.png',
      status: 'ACTIVE' as const,
    };
  }

  async getWorkload(id: string) {
    const fac = await this.findById(id);
    return {
      facultyId: fac.id,
      name: fac.name,
      department: fac.department,
      weeklyContactHours: fac.weeklyWorkloadHours,
      aicteStandardHours: 18.0,
      compliancePercentage: 100.0,
      classesToday: fac.activePeriodsCount || 3,
      assignedClasses: fac.assignedClasses || [],
    };
  }

  async getTodayClasses(id: string) {
    if (this.prisma.isConnected) {
      try {
        const fac = await this.prisma.faculty.findFirst({
          where: { OR: [{ id }, { employeeCode: id }] },
          include: {
            timetableEntries: {
              where: { dayOfWeek: 'MON' },
              include: { subject: true, room: true, section: true },
              orderBy: { period: 'asc' },
            },
          },
        });

        if (fac && fac.timetableEntries.length > 0) {
          return fac.timetableEntries.map((t, idx) => ({
            id: `FAC-C${idx + 1}`,
            period: t.period,
            time: `${t.startTime} - ${t.endTime}`,
            subjectCode: t.subject.code,
            code: t.subject.code,
            subjectName: t.subject.name,
            name: t.subject.name,
            section: t.section.name,
            room: t.room.roomNumber,
            totalStudents: 60,
            markedPresent: idx === 0 ? 56 : 0,
            status: idx === 0 ? 'COMPLETED' : idx === 1 ? 'LIVE' : 'UPCOMING',
          }));
        }
      } catch {
        // Fallback
      }
    }

    const fac = MOCK_FACULTY.find((f) => f.id === id || f.employeeCode === id) || MOCK_FACULTY[0];
    return fac.assignedClasses.map((c, idx) => ({
      id: `FAC-C${idx + 1}`,
      period: c.period,
      time: c.time,
      subjectCode: c.code,
      code: c.code,
      subjectName: c.name,
      name: c.name,
      section: c.section,
      room: c.room,
      totalStudents: 62,
      markedPresent: idx === 0 ? 58 : 0,
      status: idx === 0 ? 'COMPLETED' : idx === 1 ? 'LIVE' : 'UPCOMING',
    }));
  }
}
