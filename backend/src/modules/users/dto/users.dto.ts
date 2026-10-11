import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { UserRole, UserStatus } from '@prisma/client';
import { STRONG_PASSWORD, STRONG_PASSWORD_MESSAGE } from '../../../common/validators/password';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const trimUpper = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toUpperCase() : value);
const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const v = value.trim();
  return v === '' ? undefined : v;
};

/** Roles that sign in with a faculty profile (department + employee code). */
export const TEACHING_ROLES: UserRole[] = [UserRole.FACULTY, UserRole.HOD];
/** Non-teaching staff who get an admin profile (designation + employee id). */
export const STAFF_ROLES: UserRole[] = [
  UserRole.ADMIN,
  UserRole.ACCOUNTANT,
  UserRole.EXAM_OFFICER,
  UserRole.LIBRARIAN,
  UserRole.PLACEMENT_OFFICER,
  UserRole.HOSTEL_WARDEN,
  UserRole.TRANSPORT_MANAGER,
];
/** Every role an account can be created with from the app. SUPER_ADMIN is managed only via `.env`. */
export const CREATABLE_ROLES: UserRole[] = [UserRole.STUDENT, ...TEACHING_ROLES, ...STAFF_ROLES];

const CODE_PATTERN = /^[A-Z0-9][A-Z0-9/_-]{1,29}$/;
const CODE_MESSAGE = 'must be 2–30 characters: letters, digits, "/", "-" or "_"';
const PHONE_PATTERN = /^\+?[0-9 ()-]{7,20}$/;

const isStudent = (o: CreateUserDto) => o.role === UserRole.STUDENT;
const isTeaching = (o: CreateUserDto) => TEACHING_ROLES.includes(o.role);
const isStaff = (o: CreateUserDto) => STAFF_ROLES.includes(o.role);

export class CreateUserDto {
  @ApiProperty({ example: 'Asha Negi' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'asha.negi@jbitdoon.edu.in', description: 'Used to sign in and to receive password-reset codes' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail({}, { message: 'Enter a valid email address.' })
  @MaxLength(254)
  email: string;

  @ApiPropertyOptional({ example: '+91 98765 43210' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @Matches(PHONE_PATTERN, { message: 'Enter a valid phone number.' })
  phone?: string;

  @ApiProperty({ enum: CREATABLE_ROLES })
  @IsIn(CREATABLE_ROLES, { message: 'Choose a valid role.' })
  role: UserRole;

  @ApiProperty({ description: 'Initial password; share it privately. The user can reset it with "Forgot password".' })
  @IsString()
  @Matches(STRONG_PASSWORD, { message: STRONG_PASSWORD_MESSAGE })
  password: string;

  // ── Student ────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Student: program (determines the department)' })
  @ValidateIf(isStudent)
  @IsUUID('4', { message: 'Choose a program.' })
  programId?: string;

  @ApiPropertyOptional({ description: 'Student: section (optional)' })
  @Transform(emptyToUndefined)
  @ValidateIf((o: CreateUserDto) => isStudent(o) && o.sectionId !== undefined)
  @IsUUID('4', { message: 'Choose a valid section.' })
  sectionId?: string;

  @ApiPropertyOptional({ example: '220102048' })
  @Transform(trimUpper)
  @ValidateIf(isStudent)
  @Matches(CODE_PATTERN, { message: `Roll number ${CODE_MESSAGE}` })
  rollNumber?: string;

  @ApiPropertyOptional({ example: 'UTU2022CS048' })
  @Transform(trimUpper)
  @ValidateIf(isStudent)
  @Matches(CODE_PATTERN, { message: `Enrollment number ${CODE_MESSAGE}` })
  enrollmentNumber?: string;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @ValidateIf(isStudent)
  @IsInt()
  @Min(1)
  @Max(12)
  semester?: number;

  @ApiPropertyOptional({ example: 2026 })
  @Type(() => Number)
  @ValidateIf(isStudent)
  @IsInt()
  @Min(1990)
  @Max(2100)
  admissionYear?: number;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  guardianName?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @Matches(PHONE_PATTERN, { message: 'Enter a valid guardian phone number.' })
  guardianPhone?: string;

  // ── Faculty / HOD ──────────────────────────────────────────────────────────
  @ApiPropertyOptional({ description: 'Faculty/HOD: department' })
  @ValidateIf(isTeaching)
  @IsUUID('4', { message: 'Choose a department.' })
  departmentId?: string;

  @ApiPropertyOptional({ example: 'FAC-CSE-001', description: 'Faculty/HOD: employee code (can be used to sign in)' })
  @Transform(trimUpper)
  @ValidateIf(isTeaching)
  @Matches(CODE_PATTERN, { message: `Employee code ${CODE_MESSAGE}` })
  employeeCode?: string;

  @ApiPropertyOptional({ example: 'Ph.D. Computer Science' })
  @Transform(trim)
  @ValidateIf(isTeaching)
  @IsString()
  @IsNotEmpty({ message: 'Enter the qualification.' })
  @MaxLength(160)
  qualification?: string;

  @ApiPropertyOptional()
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(160)
  specialization?: string;

  // ── Faculty / HOD / staff ──────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'Assistant Professor' })
  @Transform(trim)
  @ValidateIf((o: CreateUserDto) => isTeaching(o) || isStaff(o))
  @IsString()
  @IsNotEmpty({ message: 'Enter the designation.' })
  @MaxLength(120)
  designation?: string;

  // ── Staff ──────────────────────────────────────────────────────────────────
  @ApiPropertyOptional({ example: 'JBIT/LIB/004', description: 'Staff: employee id' })
  @Transform(trimUpper)
  @ValidateIf(isStaff)
  @Matches(CODE_PATTERN, { message: `Employee id ${CODE_MESSAGE}` })
  employeeId?: string;
}

export class ListUsersQueryDto {
  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({ description: 'Name, email, roll number or employee code' })
  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export const SETTABLE_STATUSES = [UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED] as const;

export class UpdateUserStatusDto {
  @ApiProperty({ enum: SETTABLE_STATUSES })
  @IsIn(SETTABLE_STATUSES)
  status: (typeof SETTABLE_STATUSES)[number];
}
