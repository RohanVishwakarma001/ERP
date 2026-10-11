import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AttendanceStatus } from '@prisma/client';
import { IsUploadedFileUrl } from '../../../common/validators/uploaded-file-url';

class GeoPointDto {
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  userLat?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  userLng?: number;
}

class ClassPeriodDto {
  @IsString()
  @IsNotEmpty()
  subjectCode: string;

  @IsString()
  @IsNotEmpty()
  section: string;

  @IsInt()
  @Min(1)
  @Max(10)
  period: number;
}

export class GenerateQrDto extends ClassPeriodDto {
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}

/** Web client payload. */
export class ScanQrDto extends GeoPointDto {
  @IsString()
  @IsNotEmpty()
  qrToken: string;
}

/** Mobile client payload (same semantics, different field name). */
export class VerifyQrMobileDto extends GeoPointDto {
  @IsString()
  @IsNotEmpty()
  payload: string;
}

export class AttendanceRecordInputDto {
  @IsString()
  @IsNotEmpty()
  studentId: string;

  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;
}

export class CreatePetitionDto {
  @IsString()
  @IsNotEmpty()
  subjectCode: string;

  @Type(() => Date)
  @IsDate()
  date: Date;

  @IsInt()
  @Min(1)
  @Max(10)
  period: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;

  @IsOptional()
  @IsUploadedFileUrl()
  documentUrl?: string;
}

export class BatchAttendanceDto extends ClassPeriodDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AttendanceRecordInputDto)
  records: AttendanceRecordInputDto[];
}
