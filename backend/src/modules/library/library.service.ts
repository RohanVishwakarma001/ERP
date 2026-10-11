import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../infrastructure/prisma/prisma.service';

/** Circulation policy. */
export const LOAN_PERIOD_DAYS = 14;
export const FINE_PER_OVERDUE_DAY = 2; // INR

const DAY_MS = 24 * 60 * 60 * 1000;
const toIsoDate = (d: Date) => d.toISOString().slice(0, 10);

export function overdueDays(dueDate: Date, asOf = new Date()): number {
  return Math.max(0, Math.ceil((asOf.getTime() - dueDate.getTime()) / DAY_MS));
}

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async findAll(search?: string) {
    const where: Prisma.BookWhereInput = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { author: { contains: search, mode: 'insensitive' } },
            { isbn: { contains: search } },
          ],
        }
      : {};

    const books = await this.prisma.book.findMany({ where, orderBy: { title: 'asc' } });
    return books.map((b) => ({
      id: b.id,
      isbn: b.isbn,
      title: b.title,
      authors: b.author.split(',').map((a) => a.trim()),
      publisher: b.publisher,
      category: b.category,
      shelfLocation: b.shelfLocation,
      totalCopies: b.totalCopies,
      availableCopies: b.availableCopies,
    }));
  }

  async getMyIssuedBooks(studentId: string) {
    const issues = await this.prisma.bookIssue.findMany({
      where: { studentId, isReturned: false },
      include: { bookCopy: { include: { book: true } } },
      orderBy: { dueDate: 'asc' },
    });

    return issues.map((issue) => {
      const late = overdueDays(issue.dueDate);
      return {
        id: issue.id,
        bookTitle: issue.bookCopy.book.title,
        author: issue.bookCopy.book.author,
        barcode: issue.bookCopy.barcode,
        issueDate: toIsoDate(issue.issueDate),
        dueDate: toIsoDate(issue.dueDate),
        overdueDays: late,
        accruedFine: late * FINE_PER_OVERDUE_DAY,
      };
    });
  }

  /** Librarian desk: every book currently out on loan, most overdue first. */
  async listActiveIssues() {
    const issues = await this.prisma.bookIssue.findMany({
      where: { isReturned: false },
      include: {
        bookCopy: { include: { book: { select: { title: true, isbn: true } } } },
        student: { select: { rollNumber: true, user: { select: { name: true } } } },
      },
      orderBy: { dueDate: 'asc' },
    });

    return issues.map((issue) => {
      const late = overdueDays(issue.dueDate);
      return {
        id: issue.id,
        bookTitle: issue.bookCopy.book.title,
        isbn: issue.bookCopy.book.isbn,
        barcode: issue.bookCopy.barcode,
        studentName: issue.student.user.name,
        rollNumber: issue.student.rollNumber,
        issueDate: toIsoDate(issue.issueDate),
        dueDate: toIsoDate(issue.dueDate),
        overdueDays: late,
        accruedFine: late * FINE_PER_OVERDUE_DAY,
      };
    });
  }

  /** Checks out any available copy of the book to the student. */
  async issueBook(studentId: string, bookId: string) {
    const student = await this.prisma.student.findUnique({ where: { id: studentId }, select: { id: true } });
    if (!student) throw new NotFoundException('Student not found.');

    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.bookCopy.findFirst({ where: { bookId, isAvailable: true }, include: { book: true } });
      if (!copy) throw new ConflictException('No copies of this book are currently available.');

      // Conditional update guards against two librarians issuing the same copy concurrently.
      const claimed = await tx.bookCopy.updateMany({ where: { id: copy.id, isAvailable: true }, data: { isAvailable: false } });
      if (claimed.count === 0) throw new ConflictException('That copy was just issued. Please retry.');

      await tx.book.update({ where: { id: bookId }, data: { availableCopies: { decrement: 1 } } });
      const issue = await tx.bookIssue.create({
        data: { bookCopyId: copy.id, studentId, dueDate: new Date(Date.now() + LOAN_PERIOD_DAYS * DAY_MS) },
      });

      return {
        issueId: issue.id,
        bookTitle: copy.book.title,
        barcode: copy.barcode,
        dueDate: toIsoDate(issue.dueDate),
      };
    });
  }

  /** Returns a copy and records any overdue fine. */
  async returnBook(issueId: string) {
    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.bookIssue.findUnique({ where: { id: issueId }, include: { bookCopy: true } });
      if (!issue) throw new NotFoundException('Issue record not found.');
      if (issue.isReturned) throw new BadRequestException('This book has already been returned.');

      const now = new Date();
      const fineAmount = overdueDays(issue.dueDate, now) * FINE_PER_OVERDUE_DAY;

      await tx.bookIssue.update({ where: { id: issueId }, data: { isReturned: true, returnDate: now, fineAmount } });
      await tx.bookCopy.update({ where: { id: issue.bookCopyId }, data: { isAvailable: true } });
      await tx.book.update({ where: { id: issue.bookCopy.bookId }, data: { availableCopies: { increment: 1 } } });

      return { issueId, returnedAt: now.toISOString(), fineAmount };
    });
  }
}
