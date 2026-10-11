import {
  PrismaClient,
  UserRole,
  UserStatus,
  SubjectType,
  RoomType,
  AttendanceSessionStatus,
  AttendanceStatus,
  AttendanceVerificationMethod,
  AssessmentType,
  ResultStatus,
  AssignmentStatus,
  SubmissionStatus,
  FeeStatus,
  PaymentStatus,
  NoticeCategory,
  NoticeStatus,
  ComplaintStatus,
  CertificateType,
  CertificateStatus,
  JobApplicationStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PROD_SEED !== 'true') {
    throw new Error(
      'Refusing to run demo/seed data against a production environment. ' +
        'This script creates accounts with a shared, known password and is intended for ' +
        'local development or staging/UAT only. Set ALLOW_PROD_SEED=true to override deliberately.',
    );
  }

  console.log('🌱 Starting Comprehensive JBIT Campus ERP Database Seeding...');

  const seedPassword = process.env.SEED_DEFAULT_PASSWORD || 'Jbit@2026';
  const defaultPasswordHash = await bcrypt.hash(seedPassword, 12);

  // ==========================================
  // 1. DEPARTMENTS
  // ==========================================
  const deptCse = await prisma.department.upsert({
    where: { code: 'CSE' },
    update: {
      name: 'Computer Science & Engineering',
      building: 'Block B (Himalayan Wing)',
      budgetAllocated: 4500000,
      budgetSpent: 3120000,
      nbaAccredited: true,
    },
    create: {
      code: 'CSE',
      name: 'Computer Science & Engineering',
      building: 'Block B (Himalayan Wing)',
      budgetAllocated: 4500000,
      budgetSpent: 3120000,
      nbaAccredited: true,
    },
  });

  const deptEce = await prisma.department.upsert({
    where: { code: 'ECE' },
    update: {
      name: 'Electronics & Communication Engineering',
      building: 'Block A',
      budgetAllocated: 3200000,
      budgetSpent: 2450000,
      nbaAccredited: true,
    },
    create: {
      code: 'ECE',
      name: 'Electronics & Communication Engineering',
      building: 'Block A',
      budgetAllocated: 3200000,
      budgetSpent: 2450000,
      nbaAccredited: true,
    },
  });

  const deptMe = await prisma.department.upsert({
    where: { code: 'ME' },
    update: {
      name: 'Mechanical Engineering',
      building: 'Workshop Complex',
      budgetAllocated: 2800000,
      budgetSpent: 1950000,
      nbaAccredited: false,
    },
    create: {
      code: 'ME',
      name: 'Mechanical Engineering',
      building: 'Workshop Complex',
      budgetAllocated: 2800000,
      budgetSpent: 1950000,
      nbaAccredited: false,
    },
  });

  const deptCe = await prisma.department.upsert({
    where: { code: 'CE' },
    update: {
      name: 'Civil Engineering',
      building: 'Block C',
      budgetAllocated: 2100000,
      budgetSpent: 1420000,
      nbaAccredited: false,
    },
    create: {
      code: 'CE',
      name: 'Civil Engineering',
      building: 'Block C',
      budgetAllocated: 2100000,
      budgetSpent: 1420000,
      nbaAccredited: false,
    },
  });

  console.log('✅ Departments seeded');

  // ==========================================
  // 2. PROGRAMS
  // ==========================================
  const btechCse = await prisma.program.upsert({
    where: { code: 'BTECH_CSE' },
    update: {},
    create: {
      code: 'BTECH_CSE',
      name: 'Bachelor of Technology (Computer Science & Engineering)',
      departmentId: deptCse.id,
      durationYears: 4,
      totalSemesters: 8,
      degreeType: 'UNDERGRADUATE',
    },
  });

  const btechEce = await prisma.program.upsert({
    where: { code: 'BTECH_ECE' },
    update: {},
    create: {
      code: 'BTECH_ECE',
      name: 'Bachelor of Technology (Electronics & Communication Engineering)',
      departmentId: deptEce.id,
      durationYears: 4,
      totalSemesters: 8,
      degreeType: 'UNDERGRADUATE',
    },
  });

  console.log('✅ Programs seeded');

  // ==========================================
  // 3. SECTIONS
  // ==========================================
  let secCse6A = await prisma.section.findFirst({ where: { name: 'CSE-6A' } });
  if (!secCse6A) {
    secCse6A = await prisma.section.create({
      data: {
        name: 'CSE-6A',
        semester: 6,
        academicYear: '2025-2026',
        capacity: 60,
      },
    });
  }

  let secCse6B = await prisma.section.findFirst({ where: { name: 'CSE-6B' } });
  if (!secCse6B) {
    secCse6B = await prisma.section.create({
      data: {
        name: 'CSE-6B',
        semester: 6,
        academicYear: '2025-2026',
        capacity: 60,
      },
    });
  }

  console.log('✅ Sections seeded');

  // ==========================================
  // 4. BUILDINGS & ROOMS
  // ==========================================
  const blockB = await prisma.building.upsert({
    where: { code: 'BLOCK_B' },
    update: {},
    create: { name: 'Block B (Himalayan Wing)', code: 'BLOCK_B' },
  });

  const blockA = await prisma.building.upsert({
    where: { code: 'BLOCK_A' },
    update: {},
    create: { name: 'Block A (Administrative & Core)', code: 'BLOCK_A' },
  });

  const roomLh302 = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: blockB.id, roomNumber: 'LH-302' } },
    update: {},
    create: {
      buildingId: blockB.id,
      roomNumber: 'LH-302',
      capacity: 70,
      type: RoomType.LECTURE_HALL,
      hasProjector: true,
      hasAudio: true,
      latitude: 30.3441,
      longitude: 77.9472,
      geofenceRadius: 35.0,
    },
  });

  const roomLh303 = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: blockB.id, roomNumber: 'LH-303' } },
    update: {},
    create: {
      buildingId: blockB.id,
      roomNumber: 'LH-303',
      capacity: 70,
      type: RoomType.LECTURE_HALL,
      hasProjector: true,
      hasAudio: true,
      latitude: 30.3442,
      longitude: 77.9473,
      geofenceRadius: 35.0,
    },
  });

  const roomLab401 = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: blockB.id, roomNumber: 'Lab-401' } },
    update: {},
    create: {
      buildingId: blockB.id,
      roomNumber: 'Lab-401',
      capacity: 45,
      type: RoomType.COMPUTER_LAB,
      hasProjector: true,
      hasAudio: false,
      latitude: 30.3443,
      longitude: 77.9475,
      geofenceRadius: 30.0,
    },
  });

  const roomTuringLab = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: blockB.id, roomNumber: 'Turing-Lab' } },
    update: {},
    create: {
      buildingId: blockB.id,
      roomNumber: 'Turing-Lab',
      capacity: 60,
      type: RoomType.COMPUTER_LAB,
      hasProjector: true,
      hasAudio: true,
      latitude: 30.3444,
      longitude: 77.9476,
      geofenceRadius: 30.0,
    },
  });

  const roomAudi01 = await prisma.room.upsert({
    where: { buildingId_roomNumber: { buildingId: blockA.id, roomNumber: 'Audi-01' } },
    update: {},
    create: {
      buildingId: blockA.id,
      roomNumber: 'Audi-01',
      capacity: 250,
      type: RoomType.AUDITORIUM,
      hasProjector: true,
      hasAudio: true,
      latitude: 30.344,
      longitude: 77.947,
      geofenceRadius: 50.0,
    },
  });

  console.log('✅ Rooms seeded');

  // ==========================================
  // 5. SUBJECTS
  // ==========================================
  const subCs601 = await prisma.subject.upsert({
    where: { code: 'CS-601' },
    update: {},
    create: {
      code: 'CS-601',
      name: 'Compiler Design',
      credits: 4,
      semester: 6,
      type: SubjectType.THEORY,
      departmentId: deptCse.id,
      programId: btechCse.id,
    },
  });

  const subCs602 = await prisma.subject.upsert({
    where: { code: 'CS-602' },
    update: {},
    create: {
      code: 'CS-602',
      name: 'Cloud Computing & DevOps',
      credits: 4,
      semester: 6,
      type: SubjectType.THEORY,
      departmentId: deptCse.id,
      programId: btechCse.id,
    },
  });

  const subCs603 = await prisma.subject.upsert({
    where: { code: 'CS-603' },
    update: {},
    create: {
      code: 'CS-603',
      name: 'Machine Learning Foundations',
      credits: 4,
      semester: 6,
      type: SubjectType.THEORY,
      departmentId: deptCse.id,
      programId: btechCse.id,
    },
  });

  const subCs604 = await prisma.subject.upsert({
    where: { code: 'CS-604' },
    update: {},
    create: {
      code: 'CS-604',
      name: 'Cyber Security & Digital Forensics',
      credits: 3,
      semester: 6,
      type: SubjectType.THEORY,
      departmentId: deptCse.id,
      programId: btechCse.id,
    },
  });

  const subCs605P = await prisma.subject.upsert({
    where: { code: 'CS-605P' },
    update: {},
    create: {
      code: 'CS-605P',
      name: 'Full-Stack Web Engineering Lab',
      credits: 2,
      semester: 6,
      type: SubjectType.PRACTICAL,
      departmentId: deptCse.id,
      programId: btechCse.id,
    },
  });

  const subCs606P = await prisma.subject.upsert({
    where: { code: 'CS-606P' },
    update: {},
    create: {
      code: 'CS-606P',
      name: 'Cloud & Containerization Lab',
      credits: 2,
      semester: 6,
      type: SubjectType.PRACTICAL,
      departmentId: deptCse.id,
      programId: btechCse.id,
    },
  });

  console.log('✅ Subjects seeded');

  // ==========================================
  // 6. INSTITUTIONAL USERS & ROLES
  // ==========================================

  // --- Admin ---
  const adminUser = await prisma.user.upsert({
    where: { email: 'registrar@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'registrar@jbitdoon.edu.in',
      phone: '+91 94120 11001',
      passwordHash: defaultPasswordHash,
      name: 'Col. Rajesh Verma (Retd.)',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          designation: 'Registrar & Chief Administrator',
          employeeId: 'ADM-SYS-01',
        },
      },
    },
  });

  // Alias admin email for quick UI testing
  await prisma.user.upsert({
    where: { email: 'admin@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'admin@jbitdoon.edu.in',
      phone: '+91 94120 11000',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Rajesh Bhatt',
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          designation: 'Dean Academics & Super Admin',
          employeeId: 'JBIT/ADM/001',
        },
      },
    },
  });

  // --- HOD ---
  const hodUser = await prisma.user.upsert({
    where: { email: 'hod.cse@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'hod.cse@jbitdoon.edu.in',
      phone: '+91 94120 11002',
      passwordHash: defaultPasswordHash,
      name: 'Dr. V. K. Bhatt',
      role: UserRole.HOD,
      status: UserStatus.ACTIVE,
      faculty: {
        create: {
          employeeCode: 'FAC-CSE-001',
          departmentId: deptCse.id,
          designation: 'Professor & Head of Department',
          qualification: 'Ph.D. in Distributed Systems (IIT Roorkee)',
          specialization: 'Distributed Systems & Compiler Design',
          aicteComplianceHours: 18.0,
        },
      },
    },
    include: { faculty: true },
  });

  // --- Faculty Members ---
  const facAnanya = await prisma.user.upsert({
    where: { email: 'ananya.sen@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'ananya.sen@jbitdoon.edu.in',
      phone: '+91 94120 11003',
      passwordHash: defaultPasswordHash,
      name: 'Prof. Ananya Sen',
      role: UserRole.FACULTY,
      status: UserStatus.ACTIVE,
      faculty: {
        create: {
          employeeCode: 'FAC-CSE-004',
          departmentId: deptCse.id,
          designation: 'Assistant Professor (Senior Scale)',
          qualification: 'M.Tech CSE (NIT Kurukshetra)',
          specialization: 'Cloud Computing & DevOps',
          aicteComplianceHours: 18.0,
        },
      },
    },
    include: { faculty: true },
  });

  const facNautiyal = await prisma.user.upsert({
    where: { email: 'faculty@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'faculty@jbitdoon.edu.in',
      phone: '+91 94120 11004',
      passwordHash: defaultPasswordHash,
      name: 'Er. S. Nautiyal',
      role: UserRole.FACULTY,
      status: UserStatus.ACTIVE,
      faculty: {
        create: {
          employeeCode: 'FAC-CSE-058',
          departmentId: deptCse.id,
          designation: 'Assistant Professor',
          qualification: 'M.Tech Full-Stack (UTU)',
          specialization: 'Web Engineering & Microservices',
          aicteComplianceHours: 18.0,
        },
      },
    },
    include: { faculty: true },
  });

  const facPriya = await prisma.user.upsert({
    where: { email: 'priya.sharma@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'priya.sharma@jbitdoon.edu.in',
      phone: '+91 94120 11005',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Priya Sharma',
      role: UserRole.FACULTY,
      status: UserStatus.ACTIVE,
      faculty: {
        create: {
          employeeCode: 'FAC-CSE-019',
          departmentId: deptCse.id,
          designation: 'Associate Professor',
          qualification: 'Ph.D. in Machine Learning',
          specialization: 'AI & Neural Networks',
          aicteComplianceHours: 18.0,
        },
      },
    },
    include: { faculty: true },
  });

  // --- Students ---
  const stuAarav = await prisma.user.upsert({
    where: { email: 'aarav.sharma@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'aarav.sharma@jbitdoon.edu.in',
      phone: '+91 94120 11048',
      passwordHash: defaultPasswordHash,
      name: 'Aarav Sharma',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      student: {
        create: {
          rollNumber: '220102048',
          enrollmentNumber: 'UTU2022CS048',
          departmentId: deptCse.id,
          programId: btechCse.id,
          sectionId: secCse6A.id,
          semester: 6,
          admissionYear: 2022,
          cgpa: 8.92,
          overallAttendance: 84.5,
          isDebarred: false,
        },
      },
    },
    include: { student: true },
  });

  const stuRohan = await prisma.user.upsert({
    where: { email: 'rohan.verma@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'rohan.verma@jbitdoon.edu.in',
      phone: '+91 94120 11049',
      passwordHash: defaultPasswordHash,
      name: 'Rohan Verma',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      student: {
        create: {
          rollNumber: '2201040189',
          enrollmentNumber: 'UTU2022CS189',
          departmentId: deptCse.id,
          programId: btechCse.id,
          sectionId: secCse6A.id,
          semester: 6,
          admissionYear: 2022,
          cgpa: 8.75,
          overallAttendance: 88.0,
          isDebarred: false,
        },
      },
    },
    include: { student: true },
  });

  const stuDevendra = await prisma.user.upsert({
    where: { email: 'devendra.bisht@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'devendra.bisht@jbitdoon.edu.in',
      phone: '+91 94120 11050',
      passwordHash: defaultPasswordHash,
      name: 'Devendra Bisht',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      student: {
        create: {
          rollNumber: '220102012',
          enrollmentNumber: 'UTU2022CS012',
          departmentId: deptCse.id,
          programId: btechCse.id,
          sectionId: secCse6A.id,
          semester: 6,
          admissionYear: 2022,
          cgpa: 7.21,
          overallAttendance: 68.2,
          isDebarred: true,
        },
      },
    },
    include: { student: true },
  });

  const stuAnanya = await prisma.user.upsert({
    where: { email: 'ananya.joshi@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'ananya.joshi@jbitdoon.edu.in',
      phone: '+91 94120 11051',
      passwordHash: defaultPasswordHash,
      name: 'Ananya Joshi',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      student: {
        create: {
          rollNumber: '220102005',
          enrollmentNumber: 'UTU2022CS005',
          departmentId: deptCse.id,
          programId: btechCse.id,
          sectionId: secCse6A.id,
          semester: 6,
          admissionYear: 2022,
          cgpa: 9.45,
          overallAttendance: 92.1,
          isDebarred: false,
        },
      },
    },
    include: { student: true },
  });

  const stuKavita = await prisma.user.upsert({
    where: { email: 'kavita.rawat@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'kavita.rawat@jbitdoon.edu.in',
      phone: '+91 94120 11052',
      passwordHash: defaultPasswordHash,
      name: 'Kavita Rawat',
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      student: {
        create: {
          rollNumber: '220102018',
          enrollmentNumber: 'UTU2022CS018',
          departmentId: deptCse.id,
          programId: btechCse.id,
          sectionId: secCse6A.id,
          semester: 6,
          admissionYear: 2022,
          cgpa: 8.6,
          overallAttendance: 81.0,
          isDebarred: false,
        },
      },
    },
    include: { student: true },
  });

  // --- Institutional Officers ---
  await prisma.user.upsert({
    where: { email: 'finance@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'finance@jbitdoon.edu.in',
      phone: '+91 94120 11010',
      passwordHash: defaultPasswordHash,
      name: 'Mr. S. K. Gupta',
      role: UserRole.ACCOUNTANT,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          designation: 'Chief Accounts Officer',
          employeeId: 'JBIT/FIN/008',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'coe@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'coe@jbitdoon.edu.in',
      phone: '+91 94120 11011',
      passwordHash: defaultPasswordHash,
      name: 'Dr. Suresh Chandra Semwal',
      role: UserRole.EXAM_OFFICER,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          designation: 'Controller of Examinations (COE)',
          employeeId: 'JBIT/COE/003',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'library@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'library@jbitdoon.edu.in',
      phone: '+91 94120 11012',
      passwordHash: defaultPasswordHash,
      name: 'Mrs. Rekha Rawat',
      role: UserRole.LIBRARIAN,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          designation: 'Chief Librarian',
          employeeId: 'JBIT/LIB/012',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'placement@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'placement@jbitdoon.edu.in',
      phone: '+91 94120 11013',
      passwordHash: defaultPasswordHash,
      name: 'Prof. Sandeep Negi',
      role: UserRole.PLACEMENT_OFFICER,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          designation: 'Head - Training & Placement (TPO)',
          employeeId: 'JBIT/TPO/004',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'hostel@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'hostel@jbitdoon.edu.in',
      phone: '+91 94120 11014',
      passwordHash: defaultPasswordHash,
      name: 'Shri Balwant Singh',
      role: UserRole.HOSTEL_WARDEN,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          designation: 'Chief Hostel Warden',
          employeeId: 'JBIT/WAR/015',
        },
      },
    },
  });

  await prisma.user.upsert({
    where: { email: 'transport@jbitdoon.edu.in' },
    update: { passwordHash: defaultPasswordHash },
    create: {
      email: 'transport@jbitdoon.edu.in',
      phone: '+91 94120 11015',
      passwordHash: defaultPasswordHash,
      name: 'Shri Rameshwar Nautiyal',
      role: UserRole.TRANSPORT_MANAGER,
      status: UserStatus.ACTIVE,
      adminProfile: {
        create: {
          designation: 'Transport Incharge & Fleet Manager',
          employeeId: 'JBIT/TRA/009',
        },
      },
    },
  });

  console.log('✅ Institutional Users & Role Profiles seeded');

  // ==========================================
  // 7. TIMETABLE
  // ==========================================
  const hodFaculty = hodUser.faculty!;
  const ananyaFaculty = facAnanya.faculty!;
  const priyaFaculty = facPriya.faculty!;
  const nautiyalFaculty = facNautiyal.faculty!;

  const timetableEntries = [
    { day: 'MON', period: 1, start: '09:00 AM', end: '10:00 AM', sub: subCs601, fac: hodFaculty, rm: roomLh302 },
    { day: 'MON', period: 2, start: '10:15 AM', end: '11:15 AM', sub: subCs602, fac: ananyaFaculty, rm: roomLab401 },
    { day: 'MON', period: 3, start: '11:30 AM', end: '12:30 PM', sub: subCs603, fac: priyaFaculty, rm: roomLh303 },
    { day: 'MON', period: 5, start: '01:30 PM', end: '03:30 PM', sub: subCs605P, fac: nautiyalFaculty, rm: roomTuringLab },

    { day: 'TUE', period: 1, start: '09:00 AM', end: '10:00 AM', sub: subCs602, fac: ananyaFaculty, rm: roomLab401 },
    { day: 'TUE', period: 2, start: '10:15 AM', end: '11:15 AM', sub: subCs601, fac: hodFaculty, rm: roomLh302 },
    { day: 'TUE', period: 3, start: '11:30 AM', end: '12:30 PM', sub: subCs604, fac: priyaFaculty, rm: roomLh303 },
    { day: 'TUE', period: 5, start: '01:30 PM', end: '03:30 PM', sub: subCs606P, fac: ananyaFaculty, rm: roomLab401 },

    { day: 'WED', period: 1, start: '09:00 AM', end: '10:00 AM', sub: subCs603, fac: priyaFaculty, rm: roomLh303 },
    { day: 'WED', period: 2, start: '10:15 AM', end: '11:15 AM', sub: subCs601, fac: hodFaculty, rm: roomLh302 },
    { day: 'WED', period: 3, start: '11:30 AM', end: '12:30 PM', sub: subCs602, fac: ananyaFaculty, rm: roomLab401 },
    { day: 'WED', period: 4, start: '12:30 PM', end: '01:30 PM', sub: subCs604, fac: priyaFaculty, rm: roomLh302 },

    { day: 'THU', period: 1, start: '09:00 AM', end: '10:00 AM', sub: subCs601, fac: hodFaculty, rm: roomLh302 },
    { day: 'THU', period: 2, start: '10:15 AM', end: '11:15 AM', sub: subCs602, fac: ananyaFaculty, rm: roomLab401 },
    { day: 'THU', period: 3, start: '11:30 AM', end: '12:30 PM', sub: subCs605P, fac: nautiyalFaculty, rm: roomTuringLab },

    { day: 'FRI', period: 1, start: '09:00 AM', end: '10:00 AM', sub: subCs603, fac: priyaFaculty, rm: roomLh303 },
    { day: 'FRI', period: 2, start: '10:15 AM', end: '11:15 AM', sub: subCs604, fac: priyaFaculty, rm: roomLh302 },
    { day: 'FRI', period: 3, start: '11:30 AM', end: '12:30 PM', sub: subCs601, fac: hodFaculty, rm: roomLh302 },
  ];

  for (const t of timetableEntries) {
    const existing = await prisma.timetableEntry.findFirst({
      where: {
        dayOfWeek: t.day,
        period: t.period,
        sectionId: secCse6A.id,
      },
    });

    if (!existing) {
      await prisma.timetableEntry.create({
        data: {
          dayOfWeek: t.day,
          period: t.period,
          startTime: t.start,
          endTime: t.end,
          subjectId: t.sub.id,
          facultyId: t.fac.id,
          roomId: t.rm.id,
          sectionId: secCse6A.id,
          academicYear: '2025-2026',
        },
      });
    }
  }

  console.log('✅ Timetable Entries seeded');

  // ==========================================
  // 8. ATTENDANCE SESSIONS & STUDENT RECORDS
  // ==========================================
  const studentList = [
    { student: stuAarav.student!, attendanceRate: 0.85 },
    { student: stuRohan.student!, attendanceRate: 0.88 },
    { student: stuDevendra.student!, attendanceRate: 0.68 },
    { student: stuAnanya.student!, attendanceRate: 0.93 },
    { student: stuKavita.student!, attendanceRate: 0.81 },
  ];

  // Create 35 attendance sessions across subjects
  const subjectsForAttendance = [
    { sub: subCs601, fac: hodFaculty, totalSessions: 12 },
    { sub: subCs602, fac: ananyaFaculty, totalSessions: 10 },
    { sub: subCs603, fac: priyaFaculty, totalSessions: 8 },
    { sub: subCs605P, fac: nautiyalFaculty, totalSessions: 5 },
  ];

  let sessionCount = 0;
  for (const item of subjectsForAttendance) {
    for (let i = 0; i < item.totalSessions; i++) {
      const sessionDate = new Date(Date.now() - (item.totalSessions - i) * 86400000 * 2);
      const session = await prisma.attendanceSession.create({
        data: {
          subjectId: item.sub.id,
          sectionId: secCse6A.id,
          facultyId: item.fac.id,
          roomId: roomLh302.id,
          date: sessionDate,
          period: (i % 4) + 1,
          status: AttendanceSessionStatus.CLOSED,
        },
      });
      sessionCount++;

      // Create record for each student
      for (const st of studentList) {
        // Randomize attendance according to their rate
        const isPresent = (i + st.student.rollNumber.charCodeAt( st.student.rollNumber.length - 1 )) % 10 < (st.attendanceRate * 10);
        await prisma.attendanceRecord.create({
          data: {
            sessionId: session.id,
            studentId: st.student.id,
            status: isPresent ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT,
            verifiedVia: isPresent ? AttendanceVerificationMethod.QR : AttendanceVerificationMethod.MANUAL,
            timestamp: sessionDate,
          },
        });
      }
    }
  }

  console.log(`✅ Seeded ${sessionCount} attendance sessions with live records`);

  // ==========================================
  // 9. EXAMINATIONS & MARKS
  // ==========================================
  let examCycle = await prisma.exam.findFirst({ where: { cycle: 'EVEN_2026' } });
  if (!examCycle) {
    examCycle = await prisma.exam.create({
      data: {
        title: 'UTU Even Semester End-Term Examinations 2026',
        cycle: 'EVEN_2026',
        academicYear: '2025-2026',
        status: 'ONGOING',
      },
    });
  }

  // Exam Schedules
  const examSubs = [
    { sub: subCs601, date: new Date('2026-06-02T09:30:00Z'), start: '09:30 AM', end: '12:30 PM' },
    { sub: subCs602, date: new Date('2026-06-05T09:30:00Z'), start: '09:30 AM', end: '12:30 PM' },
    { sub: subCs603, date: new Date('2026-06-08T09:30:00Z'), start: '09:30 AM', end: '12:30 PM' },
    { sub: subCs605P, date: new Date('2026-06-11T10:00:00Z'), start: '10:00 AM', end: '01:00 PM' },
  ];

  for (const es of examSubs) {
    const existingSchedule = await prisma.examSchedule.findFirst({
      where: { examId: examCycle.id, subjectId: es.sub.id },
    });
    if (!existingSchedule) {
      await prisma.examSchedule.create({
        data: {
          examId: examCycle.id,
          subjectId: es.sub.id,
          date: es.date,
          startTime: es.start,
          endTime: es.end,
          maxMarks: 100,
        },
      });
    }
  }

  // Assessments and marks for CS-601 and CS-602
  const cia1Cs601 = await prisma.assessment.create({
    data: {
      subjectId: subCs601.id,
      sectionId: secCse6A.id,
      title: 'Continuous Internal Assessment - 1 (CIA-I)',
      type: AssessmentType.INTERNAL_CIA_1,
      maxMarks: 30,
      weightage: 30.0,
    },
  });

  await prisma.mark.createMany({
    data: [
      { assessmentId: cia1Cs601.id, studentId: stuAarav.student!.id, marksObtained: 27 },
      { assessmentId: cia1Cs601.id, studentId: stuRohan.student!.id, marksObtained: 26 },
      { assessmentId: cia1Cs601.id, studentId: stuDevendra.student!.id, marksObtained: 18 },
      { assessmentId: cia1Cs601.id, studentId: stuAnanya.student!.id, marksObtained: 29 },
      { assessmentId: cia1Cs601.id, studentId: stuKavita.student!.id, marksObtained: 25 },
    ],
    skipDuplicates: true,
  });

  // Results for Aarav Sharma & Rohan Verma
  await prisma.result.upsert({
    where: {
      studentId_semester_academicYear: {
        studentId: stuAarav.student!.id,
        semester: 5,
        academicYear: '2024-2025',
      },
    },
    update: {},
    create: {
      studentId: stuAarav.student!.id,
      semester: 5,
      academicYear: '2024-2025',
      sgpa: 9.12,
      cgpa: 8.92,
      totalCreditsEarned: 24,
      status: ResultStatus.PUBLISHED,
      publishedAt: new Date('2025-07-15'),
    },
  });

  await prisma.result.upsert({
    where: {
      studentId_semester_academicYear: {
        studentId: stuRohan.student!.id,
        semester: 5,
        academicYear: '2024-2025',
      },
    },
    update: {},
    create: {
      studentId: stuRohan.student!.id,
      semester: 5,
      academicYear: '2024-2025',
      sgpa: 8.85,
      cgpa: 8.75,
      totalCreditsEarned: 24,
      status: ResultStatus.PUBLISHED,
      publishedAt: new Date('2025-07-15'),
    },
  });

  console.log('✅ Examinations & Results seeded');

  // ==========================================
  // 10. ASSIGNMENTS & STUDY MATERIALS
  // ==========================================
  const assign1 = await prisma.assignment.create({
    data: {
      subjectId: subCs601.id,
      sectionId: secCse6A.id,
      facultyId: hodFaculty.id,
      title: 'LL(1) Parser Implementation with Left-Factoring',
      description: 'Implement a shift-reduce or predictive LL(1) parsing table generator in C++/Python with conflict resolution for ambiguous grammar rules.',
      deadline: new Date(Date.now() + 86400000 * 7),
      maxMarks: 20,
      status: AssignmentStatus.PUBLISHED,
    },
  });

  const assign2 = await prisma.assignment.create({
    data: {
      subjectId: subCs602.id,
      sectionId: secCse6A.id,
      facultyId: ananyaFaculty.id,
      title: 'Multi-Tier Microservice Deployment on Kubernetes',
      description: 'Write Helm charts and Kubernetes manifests for deploying a Node.js + Redis service with Horizontal Pod Autoscaling (HPA) and Ingress controllers.',
      deadline: new Date(Date.now() + 86400000 * 10),
      maxMarks: 20,
      status: AssignmentStatus.PUBLISHED,
    },
  });

  // Aarav submission
  await prisma.assignmentSubmission.create({
    data: {
      assignmentId: assign1.id,
      studentId: stuAarav.student!.id,
      fileUrl: 'https://storage.jbitdoon.edu.in/submissions/aarav-cs601-assign1.pdf',
      status: SubmissionStatus.SUBMITTED,
    },
  });

  // Study Materials
  await prisma.studyMaterial.createMany({
    data: [
      {
        subjectId: subCs601.id,
        facultyId: hodFaculty.id,
        title: 'Unit-3 Syntax Directed Translation & Intermediate Code Gen',
        description: 'Comprehensive 48-page slide deck on Three-Address Code, Quadruples, and DAG representations.',
        fileUrl: 'https://storage.jbitdoon.edu.in/materials/cs601-unit3.pdf',
        fileType: 'PDF',
        fileSize: 4820000,
      },
      {
        subjectId: subCs602.id,
        facultyId: ananyaFaculty.id,
        title: 'Terraform & Docker Containerization Lab Manual',
        description: 'Hands-on lab manual covering multi-stage builds and AWS ECS cluster creation.',
        fileUrl: 'https://storage.jbitdoon.edu.in/materials/cs602-lab-manual.pdf',
        fileType: 'PDF',
        fileSize: 3100000,
      },
    ],
  });

  console.log('✅ Assignments & Study Materials seeded');

  // ==========================================
  // 11. FEES & FINANCIAL TRANSACTIONS
  // ==========================================
  const feeStructure = await prisma.feeStructure.upsert({
    where: {
      programId_semester_academicYear: {
        programId: btechCse.id,
        semester: 6,
        academicYear: '2025-2026',
      },
    },
    update: {},
    create: {
      programId: btechCse.id,
      semester: 6,
      academicYear: '2025-2026',
      tuitionFee: 40000,
      developmentFee: 5000,
      labFee: 5000,
      libraryFee: 2500,
      examFee: 2500,
      totalAmount: 55000,
    },
  });

  const studentFeeAarav = await prisma.studentFee.upsert({
    where: {
      studentId_feeStructureId: {
        studentId: stuAarav.student!.id,
        feeStructureId: feeStructure.id,
      },
    },
    update: {},
    create: {
      studentId: stuAarav.student!.id,
      feeStructureId: feeStructure.id,
      totalAmount: 55000,
      paidAmount: 55000,
      pendingAmount: 0,
      dueDate: new Date('2026-04-15'),
      status: FeeStatus.PAID,
    },
  });

  await prisma.feeTransaction.create({
    data: {
      studentFeeId: studentFeeAarav.id,
      transactionId: 'TXN-JBIT-202604-0982',
      amount: 55000,
      paymentMethod: 'ONLINE_RAZORPAY',
      status: PaymentStatus.SUCCESS,
      receiptNumber: 'REC-2026-0489',
      paidAt: new Date('2026-04-10T11:20:00Z'),
    },
  });

  // Devendra Bisht (Pending Fees)
  await prisma.studentFee.upsert({
    where: {
      studentId_feeStructureId: {
        studentId: stuDevendra.student!.id,
        feeStructureId: feeStructure.id,
      },
    },
    update: {},
    create: {
      studentId: stuDevendra.student!.id,
      feeStructureId: feeStructure.id,
      totalAmount: 55000,
      paidAmount: 42500,
      pendingAmount: 12500,
      dueDate: new Date('2026-04-15'),
      status: FeeStatus.OVERDUE,
    },
  });

  console.log('✅ Fee Structures & Transactions seeded');

  // ==========================================
  // 12. NOTICES & CENTRALIZED NOTIFICATIONS
  // ==========================================
  await prisma.notice.createMany({
    data: [
      {
        title: 'UTU Even Semester Final Practical & Theory Examinations 2026 Schedule',
        summary: 'Veer Madho Singh Bhandari Uttarakhand Technical University has issued the statutory examination timetable for 6th and 8th semester B.Tech students.',
        content: 'All eligible students are instructed to verify their attendance on the JBIT ERP portal before May 30, 2026. Hall tickets will be released exclusively through the digital portal.',
        category: NoticeCategory.EXAM,
        authorName: 'Office of Controller of Examinations',
        isUrgent: true,
        status: NoticeStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 86400000),
      },
      {
        title: 'Infosys SpringBoard & TCS Digital Recruitment Drive — Registration Extended',
        summary: 'Eligible 2026 batch B.Tech CSE, ECE students with CGPA >= 7.0 and 0 active backlogs can register via Training & Placement portal.',
        content: 'Package offered: 7.20 LPA to 9.50 LPA. Online coding assessments will be conducted at Turing Innovation Lab on June 5, 2026.',
        category: NoticeCategory.PLACEMENT,
        authorName: 'Training & Placement Cell (TPO)',
        isUrgent: false,
        status: NoticeStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        title: 'Statutory 75% Attendance Compliance Notice (UTU Ordinance 14B)',
        summary: 'Students failing to maintain a cumulative 75% attendance threshold across theory and lab subjects will be debarred from semester examinations.',
        content: 'Medical and duty leaves must be substantiated with valid paperwork endorsed by the respective HOD within 72 hours of absence.',
        category: NoticeCategory.ACADEMIC,
        authorName: 'Academic Council & Dean Office',
        isUrgent: true,
        status: NoticeStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 86400000 * 3),
      },
      {
        title: 'Central Knowledge Repository & Library Book Clearance for Final Semesters',
        summary: 'All students are reminded to return overdue books to the Central Library before June 10 to avoid RFID fine accruals and obtain clearance.',
        content: 'Online renewal is available via the mobile app for up to 14 additional days if no reservations are pending on the accession number.',
        category: NoticeCategory.CIRCULAR,
        authorName: 'Chief Librarian',
        isUrgent: false,
        status: NoticeStatus.PUBLISHED,
        publishedAt: new Date(Date.now() - 86400000 * 5),
      },
    ],
  });

  // Notifications for Aarav Sharma
  await prisma.notification.createMany({
    data: [
      {
        userId: stuAarav.id,
        title: 'UTU Exam Schedule Released',
        message: 'Your End-Term Examination Schedule for CS-601 through CS-606P is now available.',
        category: 'EXAM',
        link: '/student/exams',
        isRead: false,
      },
      {
        userId: stuAarav.id,
        title: 'TCS Digital Drive Shortlisted',
        message: 'Congratulations! You have been shortlisted for Technical Round 1 on June 5.',
        category: 'PLACEMENT',
        link: '/student/placement',
        isRead: false,
      },
      {
        userId: stuAarav.id,
        title: 'Attendance Standing: 84.5%',
        message: 'Your statutory attendance is above 75%. Hall ticket release status: ELIGIBLE.',
        category: 'ACADEMIC',
        link: '/student/attendance',
        isRead: true,
      },
    ],
  });

  console.log('✅ Notices & Notifications seeded');

  // ==========================================
  // 13. GRIEVANCES & COMPLAINTS
  // ==========================================
  const comp1 = await prisma.complaint.create({
    data: {
      studentId: stuAarav.student!.id,
      category: 'INFRASTRUCTURE',
      priority: 'HIGH',
      subject: 'Wi-Fi Access Point Latency in Himalayan Wing (LH-302)',
      description: 'The access point in Room LH-302 experiences intermittent DNS resolution timeouts during laboratory sessions.',
      status: ComplaintStatus.IN_PROGRESS,
      resolutionNotes: 'Network engineering team has dispatched a replacement Cisco Catalyst AP unit.',
    },
  });

  await prisma.complaintComment.create({
    data: {
      complaintId: comp1.id,
      authorId: adminUser.id,
      authorName: 'Campus IT Helpdesk',
      comment: 'Re-routed optical uplink. Verifying signal throughput during evening audit.',
    },
  });

  console.log('✅ Grievances & Redressal seeded');

  // ==========================================
  // 14. CENTRAL LIBRARY (RFID)
  // ==========================================
  const booksData = [
    { isbn: '978-0131103627', title: 'The C Programming Language', author: 'Brian W. Kernighan, Dennis M. Ritchie', cat: 'Computer Science', copies: 8, shelf: 'Rack-A-01' },
    { isbn: '978-0321486813', title: 'Compilers: Principles, Techniques, & Tools (Dragon Book)', author: 'Alfred V. Aho, Monica S. Lam, Ravi Sethi', cat: 'Computer Science', copies: 6, shelf: 'Rack-B-04' },
    { isbn: '978-0133594140', title: 'Cloud Computing: Concepts, Technology & Architecture', author: 'Thomas Erl, Ricardo Puttini', cat: 'DevOps & Cloud', copies: 5, shelf: 'Rack-C-02' },
    { isbn: '978-0132856201', title: 'Computer Networking: A Top-Down Approach', author: 'James F. Kurose, Keith W. Ross', cat: 'Networks', copies: 10, shelf: 'Rack-A-03' },
    { isbn: '978-0387310732', title: 'Pattern Recognition and Machine Learning', author: 'Christopher M. Bishop', cat: 'Artificial Intelligence', copies: 4, shelf: 'Rack-D-01' },
  ];

  for (const b of booksData) {
    const book = await prisma.book.upsert({
      where: { isbn: b.isbn },
      update: {},
      create: {
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        publisher: 'Pearson / Springer',
        category: b.cat,
        totalCopies: b.copies,
        availableCopies: b.copies - 1,
        shelfLocation: b.shelf,
      },
    });

    const copy = await prisma.bookCopy.upsert({
      where: { barcode: `RFID-JBIT-${b.isbn.slice(-4)}-01` },
      update: {},
      create: {
        bookId: book.id,
        barcode: `RFID-JBIT-${b.isbn.slice(-4)}-01`,
        isAvailable: false,
      },
    });

    // Issue dragon book copy to Aarav
    if (b.isbn === '978-0321486813') {
      const existingIssue = await prisma.bookIssue.findFirst({
        where: { bookCopyId: copy.id, studentId: stuAarav.student!.id, isReturned: false },
      });
      if (!existingIssue) {
        await prisma.bookIssue.create({
          data: {
            bookCopyId: copy.id,
            studentId: stuAarav.student!.id,
            issueDate: new Date(Date.now() - 86400000 * 10),
            dueDate: new Date(Date.now() + 86400000 * 4),
            fineAmount: 0,
            isReturned: false,
          },
        });
      }
    }
  }

  console.log('✅ Central Library books & issues seeded');

  // ==========================================
  // 15. TRAINING & PLACEMENT CELL (TPO)
  // ==========================================
  const compTcs = await prisma.company.upsert({
    where: { id: 'comp-tcs-01' },
    update: {},
    create: {
      id: 'comp-tcs-01',
      name: 'Tata Consultancy Services (TCS)',
      industry: 'Information Technology & Consulting',
      website: 'https://www.tcs.com',
    },
  });

  const compAws = await prisma.company.upsert({
    where: { id: 'comp-aws-01' },
    update: {},
    create: {
      id: 'comp-aws-01',
      name: 'Amazon Web Services (AWS)',
      industry: 'Cloud Infrastructure & Software Engineering',
      website: 'https://aws.amazon.com',
    },
  });

  const driveTcs = await prisma.placementDrive.create({
    data: {
      companyId: compTcs.id,
      role: 'System Engineer & Digital Specialist (MTS)',
      ctc: '7.50 - 9.20 LPA',
      minCgpa: 7.0,
      maxBacklogs: 0,
      allowedBatches: '2026',
      location: 'Noida / Dehradun Hub',
      deadline: new Date(Date.now() + 86400000 * 5),
      status: 'ACTIVE',
    },
  });

  const driveAws = await prisma.placementDrive.create({
    data: {
      companyId: compAws.id,
      role: 'Cloud Support Associate & DevOps Engineer',
      ctc: '14.00 LPA',
      minCgpa: 8.0,
      maxBacklogs: 0,
      allowedBatches: '2026',
      location: 'Bengaluru / Gurugram',
      deadline: new Date(Date.now() + 86400000 * 12),
      status: 'ACTIVE',
    },
  });

  await prisma.jobApplication.create({
    data: {
      driveId: driveTcs.id,
      studentId: stuAarav.student!.id,
      resumeUrl: 'https://storage.jbitdoon.edu.in/resumes/aarav-sharma-btech2026.pdf',
      status: JobApplicationStatus.SHORTLISTED,
      offeredCtc: '9.20 LPA',
      loiAccepted: true,
      loiSignedAt: new Date(),
    },
  });

  console.log('✅ Placement Companies & Drives seeded');

  // ==========================================
  // 16. HOSTEL ALLOCATION
  // ==========================================
  let hostelBldg = await prisma.hostelBuilding.findFirst({ where: { name: 'Shivalik Boys Hostel' } });
  if (!hostelBldg) {
    hostelBldg = await prisma.hostelBuilding.create({
      data: {
        name: 'Shivalik Boys Hostel',
        gender: 'MALE',
        floors: 4,
      },
    });
  }

  const room204 = await prisma.hostelRoom.upsert({
    where: { buildingId_roomNumber: { buildingId: hostelBldg.id, roomNumber: '204' } },
    update: {},
    create: {
      buildingId: hostelBldg.id,
      roomNumber: '204',
      floor: 2,
      totalBeds: 3,
    },
  });

  const bedA = await prisma.hostelBed.upsert({
    where: { roomId_bedNumber: { roomId: room204.id, bedNumber: 'Bed-A' } },
    update: {},
    create: {
      roomId: room204.id,
      bedNumber: 'Bed-A',
      isOccupied: true,
    },
  });

  await prisma.hostelBed.upsert({
    where: { roomId_bedNumber: { roomId: room204.id, bedNumber: 'Bed-B' } },
    update: {},
    create: {
      roomId: room204.id,
      bedNumber: 'Bed-B',
      isOccupied: false,
    },
  });

  await prisma.hostelAllocation.upsert({
    where: { studentId: stuAarav.student!.id },
    update: {},
    create: {
      studentId: stuAarav.student!.id,
      bedId: bedA.id,
      academicYear: '2025-2026',
    },
  });

  console.log('✅ Hostel buildings, rooms, and allocations seeded');

  // ==========================================
  // 17. TRANSPORT & FLEET
  // ==========================================
  const route1 = await prisma.busRoute.upsert({
    where: { routeNumber: 'Route-12' },
    update: {},
    create: {
      routeNumber: 'Route-12',
      name: 'Clock Tower to JBIT Campus',
      stops: 'Clock Tower, Ballupur Chowk, Premnagar, Sudhowala, Manduwala, JBIT Campus',
      departureTime: '07:30 AM',
    },
  });

  const bus1 = await prisma.bus.upsert({
    where: { busNumber: 'UK-07-PA-4012' },
    update: {},
    create: {
      busNumber: 'UK-07-PA-4012',
      routeId: route1.id,
      capacity: 52,
      driverName: 'Sardar Baljit Singh',
      driverPhone: '+91 98370 41201',
      currentLat: 30.3445,
      currentLng: 77.9478,
      isGpsActive: true,
    },
  });

  await prisma.transportAssignment.upsert({
    where: { studentId: stuRohan.student!.id },
    update: {},
    create: {
      studentId: stuRohan.student!.id,
      busId: bus1.id,
      pickupStop: 'Ballupur Chowk',
      passNumber: 'JBIT-PASS-2026-1049',
      validUntil: new Date('2026-06-30'),
    },
  });

  console.log('✅ Transport Fleet & Passes seeded');

  console.log('🎉 ==========================================================');
  console.log('🎉 COMPLETE JBIT CAMPUS ERP SEEDING FINISHED SUCCESSFULLY!');
  console.log('🎉 Real PostgreSQL database is now fully populated for all roles!');
  console.log('🎉 ==========================================================');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
