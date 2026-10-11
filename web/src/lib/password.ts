/** Mirrors the backend rule (backend/src/common/validators/password.ts). */
export const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
export const STRONG_PASSWORD_HINT = "Use 8–72 characters with upper- and lower-case letters, a number and a symbol.";

/** A random password that satisfies the strength rule, from the browser's CSPRNG. */
export function generatePassword() {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*?"];
  const all = sets.join("");
  const random = (n: number) => crypto.getRandomValues(new Uint32Array(1))[0] % n;
  const chars = [...sets.map((s) => s[random(s.length)]), ...Array.from({ length: 10 }, () => all[random(all.length)])];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = random(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}
