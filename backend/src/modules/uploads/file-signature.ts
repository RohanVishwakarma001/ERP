/**
 * Content sniffing for uploads. The `Content-Type` a client sends is just a
 * claim — an attacker can label an HTML or SVG payload `image/png`. We accept a
 * file only when its leading bytes match a signature for the declared type.
 */

type Signature = { offset: number; bytes: number[] };

const PDF: Signature[] = [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46, 0x2d] }]; // %PDF-
const PNG: Signature[] = [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }];
const JPEG: Signature[] = [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }];
const WEBP: Signature[] = [
  { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] }, // RIFF
  { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] }, // WEBP
];
const OLE2: Signature[] = [{ offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }]; // legacy .doc
const ZIP: Signature[] = [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }]; // also .docx

/** Allowed MIME type → required signature and the only extensions accepted for it. */
export const UPLOAD_TYPES: Record<string, { signature: Signature[]; extensions: string[] }> = {
  'application/pdf': { signature: PDF, extensions: ['pdf'] },
  'image/png': { signature: PNG, extensions: ['png'] },
  'image/jpeg': { signature: JPEG, extensions: ['jpg', 'jpeg'] },
  'image/webp': { signature: WEBP, extensions: ['webp'] },
  'application/msword': { signature: OLE2, extensions: ['doc'] },
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { signature: ZIP, extensions: ['docx'] },
  'application/zip': { signature: ZIP, extensions: ['zip'] },
};

export function matchesSignature(buffer: Buffer, mimeType: string): boolean {
  const type = UPLOAD_TYPES[mimeType];
  if (!type) return false;
  return type.signature.every(({ offset, bytes }) =>
    buffer.length >= offset + bytes.length && bytes.every((b, i) => buffer[offset + i] === b),
  );
}

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.');
  return dot === -1 ? '' : filename.slice(dot + 1).toLowerCase();
}

/**
 * Reduces a client-supplied filename to a safe base name: no path components,
 * control characters or shell/URL metacharacters, bounded length.
 */
export function sanitizeFilename(filename: string): string {
  const base = filename.split(/[\\/]/).pop() ?? '';
  const cleaned = base.replace(/[^A-Za-z0-9._ -]/g, '_').replace(/^\.+/, '').slice(0, 100);
  return cleaned || 'file';
}
