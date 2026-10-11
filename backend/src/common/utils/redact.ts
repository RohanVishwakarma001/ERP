/**
 * Helpers for keeping credentials and personal data out of logs.
 */

/** `a***@domain` / `2***48` — enough to correlate log lines without writing PII. */
export function maskIdentifier(identifier: string): string {
  const [local, domain] = identifier.split('@');
  const head = local.slice(0, 1);
  return domain ? `${head}***@${domain}` : `${head}***${identifier.length > 4 ? identifier.slice(-2) : ''}`;
}

/** Strips the query string, which may carry tokens, codes or search terms. */
export function pathOnly(url: string): string {
  const q = url.indexOf('?');
  return q === -1 ? url : url.slice(0, q);
}
