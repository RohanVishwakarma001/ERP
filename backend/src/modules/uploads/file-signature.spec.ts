import { extensionOf, matchesSignature, sanitizeFilename } from './file-signature';

const bytes = (...b: number[]) => Buffer.from(b);

describe('upload file signatures', () => {
  it('accepts content that matches the declared type', () => {
    expect(matchesSignature(Buffer.from('%PDF-1.7\n...'), 'application/pdf')).toBe(true);
    expect(matchesSignature(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00), 'image/png')).toBe(true);
    expect(matchesSignature(bytes(0xff, 0xd8, 0xff, 0xe0), 'image/jpeg')).toBe(true);
    expect(matchesSignature(Buffer.from('RIFF\x00\x00\x00\x00WEBPVP8 ', 'latin1'), 'image/webp')).toBe(true);
  });

  it('rejects HTML/SVG disguised as an image or PDF', () => {
    expect(matchesSignature(Buffer.from('<script>alert(1)</script>'), 'image/png')).toBe(false);
    expect(matchesSignature(Buffer.from('<svg onload="alert(1)">'), 'application/pdf')).toBe(false);
  });

  it('rejects types outside the allowlist and truncated buffers', () => {
    expect(matchesSignature(Buffer.from('<svg/>'), 'image/svg+xml')).toBe(false);
    expect(matchesSignature(Buffer.from('text/html'), 'text/html')).toBe(false);
    expect(matchesSignature(bytes(0x89, 0x50), 'image/png')).toBe(false);
  });

  it('sanitizes client filenames', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('C:\\Users\\x\\report.pdf')).toBe('report.pdf');
    expect(sanitizeFilename('<img src=x>.png')).toBe('_img src_x_.png');
    expect(sanitizeFilename('.htaccess')).toBe('htaccess');
    expect(sanitizeFilename('')).toBe('file');
    expect(extensionOf('Report.Final.PDF')).toBe('pdf');
  });
});
