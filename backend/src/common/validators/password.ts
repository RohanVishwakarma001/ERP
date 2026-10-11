/**
 * bcrypt only hashes the first 72 bytes, so anything longer would silently be
 * truncated. At least 8 chars with upper, lower, digit and symbol.
 *
 * Shared by the auth DTOs, admin-created accounts and the bootstrap admin
 * passwords in `.env`, so every password in the system meets the same bar.
 */
export const STRONG_PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;
export const STRONG_PASSWORD_MESSAGE =
  'Password must be 8–72 characters and include upper- and lower-case letters, a number and a symbol.';
