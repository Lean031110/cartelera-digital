import { ulid } from 'ulid';

/**
 * New entity ID. ULID in text form, lexicographically sortable (spec §7.1).
 */
export function newId(): string {
  return ulid();
}
