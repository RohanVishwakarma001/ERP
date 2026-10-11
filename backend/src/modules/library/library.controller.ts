import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { LibraryService } from './library.service';
import { CurrentStudentId, Roles } from '../../common/decorators';
import { RoleGroups } from '../../common/constants/role-groups';
import { IssueBookDto, LibrarySearchQueryDto } from './dto/library.dto';

@ApiTags('Central Library (RFID)')
@ApiBearerAuth()
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('books')
  @ApiOperation({ summary: 'Search the catalogue by title, author or ISBN' })
  findAll(@Query() query: LibrarySearchQueryDto) {
    return this.libraryService.findAll(query.search);
  }

  @Get('my-books')
  @Roles(UserRole.STUDENT)
  @ApiOperation({ summary: 'Student: books currently borrowed, due dates and accrued fines' })
  getMyBooks(@CurrentStudentId() studentId: string) {
    return this.libraryService.getMyIssuedBooks(studentId);
  }

  @Get('issues')
  @Roles(...RoleGroups.LIBRARY)
  @ApiOperation({ summary: 'Librarian: books currently on loan, with due dates and accrued fines' })
  listActiveIssues() {
    return this.libraryService.listActiveIssues();
  }

  @Post('issue')
  @Roles(...RoleGroups.LIBRARY)
  @ApiOperation({ summary: 'Librarian: issue an available copy to a student' })
  issueBook(@Body() dto: IssueBookDto) {
    return this.libraryService.issueBook(dto.studentId, dto.bookId);
  }

  @Post('return/:issueId')
  @Roles(...RoleGroups.LIBRARY)
  @ApiOperation({ summary: 'Librarian: process a return and record any overdue fine' })
  returnBook(@Param('issueId') issueId: string) {
    return this.libraryService.returnBook(issueId);
  }
}
