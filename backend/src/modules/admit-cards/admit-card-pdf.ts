import PDFDocument = require('pdfkit');

export const INSTITUTION_NAME = 'JB Institute of Technology, Dehradun';
export const AFFILIATION = 'Affiliated to Veer Madho Singh Bhandari Uttarakhand Technical University';

export interface AdmitCardPdfData {
  cardNumber: string;
  approvedAt: Date;
  exam: { title: string; cycle: string; academicYear: string };
  student: {
    name: string;
    rollNumber: string;
    enrollmentNumber: string;
    program: string;
    department: string;
    semester: number;
    section: string | null;
  };
  papers: { date: Date; startTime: string; endTime: string; code: string; name: string; seat: string | null }[];
}

const INSTRUCTIONS = [
  'Carry this admit card and your college ID card to every paper. Entry is not allowed without them.',
  'Reach the examination hall at least 20 minutes before the paper starts.',
  'Mobile phones, smart watches and other electronic devices are not allowed in the hall.',
  'Any form of unfair means will lead to cancellation of the paper under university ordinances.',
];

const formatDate = (d: Date) =>
  d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', weekday: 'short', timeZone: 'Asia/Kolkata' });

/** Renders an A4 admit card and resolves with the PDF bytes. */
export function renderAdmitCardPdf(data: AdmitCardPdfData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 48,
      info: { Title: `Admit card ${data.cardNumber}`, Author: INSTITUTION_NAME, Subject: data.exam.title },
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;

    // Header
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#0B3B60').text(INSTITUTION_NAME, { align: 'center' });
    doc.font('Helvetica').fontSize(9).fillColor('#555555').text(AFFILIATION, { align: 'center' });
    doc.moveDown(0.6);
    doc.font('Helvetica-Bold').fontSize(13).fillColor('#111111').text('ADMIT CARD', { align: 'center', characterSpacing: 2 });
    doc.font('Helvetica').fontSize(10).text(`${data.exam.title} · ${data.exam.academicYear}`, { align: 'center' });
    doc.moveDown(0.8);
    doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor('#0B3B60').lineWidth(1).stroke();
    doc.moveDown(0.8);

    // Student details, two columns
    const rows: [string, string][] = [
      ['Name', data.student.name],
      ['Roll number', data.student.rollNumber],
      ['Enrollment number', data.student.enrollmentNumber],
      ['Program', data.student.program],
      ['Department', data.student.department],
      ['Semester', String(data.student.semester) + (data.student.section ? ` · Section ${data.student.section}` : '')],
      ['Admit card no.', data.cardNumber],
      ['Exam cycle', data.exam.cycle],
    ];
    const colWidth = width / 2;
    const startY = doc.y;
    rows.forEach(([label, value], i) => {
      const x = left + (i % 2) * colWidth;
      const y = startY + Math.floor(i / 2) * 34;
      doc.font('Helvetica').fontSize(8).fillColor('#666666').text(label.toUpperCase(), x, y, { width: colWidth - 12 });
      doc.font('Helvetica-Bold').fontSize(11).fillColor('#111111').text(value, x, y + 11, { width: colWidth - 12, ellipsis: true, height: 16 });
    });
    doc.y = startY + Math.ceil(rows.length / 2) * 34 + 8;
    doc.x = left;

    // Papers table
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#0B3B60').text('Examination schedule', left, doc.y);
    doc.moveDown(0.4);
    const cols = [
      { title: 'Date', w: 0.22 },
      { title: 'Time', w: 0.2 },
      { title: 'Code', w: 0.14 },
      { title: 'Course', w: 0.3 },
      { title: 'Hall / Seat', w: 0.14 },
    ];
    const drawRow = (cells: string[], bold: boolean) => {
      const y = doc.y;
      let x = left;
      const heights = cells.map((text, i) =>
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).heightOfString(text, { width: cols[i].w * width - 8 }),
      );
      const h = Math.max(...heights) + 10;
      if (bold) doc.rect(left, y, width, h).fill('#EEF3F8');
      cells.forEach((text, i) => {
        doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor('#111111').text(text, x + 4, y + 5, { width: cols[i].w * width - 8 });
        x += cols[i].w * width;
      });
      doc.moveTo(left, y + h).lineTo(left + width, y + h).strokeColor('#D0D7DE').lineWidth(0.5).stroke();
      doc.y = y + h;
    };
    drawRow(cols.map((c) => c.title), true);
    for (const p of data.papers) {
      drawRow([formatDate(p.date), `${p.startTime} – ${p.endTime}`, p.code, p.name, p.seat ?? 'To be announced'], false);
    }
    doc.moveDown(1);
    doc.x = left;

    // Instructions
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0B3B60').text('Instructions');
    doc.moveDown(0.3);
    doc.font('Helvetica').fontSize(9).fillColor('#333333');
    INSTRUCTIONS.forEach((line, i) => doc.text(`${i + 1}. ${line}`, { width }));

    // Signatures
    const sigY = Math.max(doc.y + 50, doc.page.height - doc.page.margins.bottom - 70);
    doc.moveTo(left, sigY).lineTo(left + 160, sigY).strokeColor('#999999').stroke();
    doc.moveTo(left + width - 160, sigY).lineTo(left + width, sigY).stroke();
    doc.font('Helvetica').fontSize(9).fillColor('#333333');
    doc.text("Candidate's signature", left, sigY + 4, { width: 160 });
    doc.text('Controller of Examinations', left + width - 160, sigY + 4, { width: 160, align: 'right' });
    doc
      .fontSize(7.5)
      .fillColor('#777777')
      .text(
        `Approved ${data.approvedAt.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' })} · Card ${data.cardNumber} · Issued electronically by the JBIT Campus ERP`,
        left,
        sigY + 24,
        { width, align: 'center' },
      );

    doc.end();
  });
}
