import {
  createTransientKeyHolder,
  type TransientKeyHolder,
} from "../api/transient-key";

/**
 * App-level naming alias for the hardened API-layer holder. It deliberately
 * offers no getter: a key can only be exposed inside a short consumer call.
 */
export type EphemeralKeySession = TransientKeyHolder;

export function createEphemeralKeySession(): EphemeralKeySession {
  return createTransientKeyHolder();
}
