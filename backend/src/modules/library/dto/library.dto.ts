import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class LibrarySearchQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;
}

export class IssueBookDto {
  @IsUUID()
  studentId: string;

  @IsUUID()
  bookId: string;
}
