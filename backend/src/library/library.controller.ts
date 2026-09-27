import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators';

@ApiTags('Central Library (RFID)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('books')
  @ApiOperation({ summary: 'Search and browse RFID book catalog' })
  async findAll(@Query('search') search?: string) {
    return this.libraryService.findAll({ search });
  }

  @Get('my-books')
  @ApiOperation({ summary: 'Student: View active borrowed books, due dates, and fines' })
  async getMyBooks(@CurrentUser() user: any) {
    return this.libraryService.getMyIssuedBooks(user.studentId || user.id || 'stu-01');
  }

  @Post('issue')
  @ApiOperation({ summary: 'Librarian: Issue book copy to student' })
  async issueBook(@Body() body: { studentId: string; bookId: string }) {
    return this.libraryService.issueBook(body.studentId, body.bookId);
  }

  @Post('return/:issueId')
  @ApiOperation({ summary: 'Librarian: Process return and reconcile fines' })
  async returnBook(@Param('issueId') issueId: string) {
    return this.libraryService.returnBook(issueId);
  }
}
