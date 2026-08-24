import type { DirectByokAdapter } from "./direct-byok-adapter";

export interface DirectByokRegistry {
  list(): readonly DirectByokAdapter[];
  get(providerId: string): DirectByokAdapter | undefined;
}

class ImmutableDirectByokRegistry implements DirectByokRegistry {
  readonly #adapters: readonly DirectByokAdapter[];
  readonly #byId: ReadonlyMap<string, DirectByokAdapter>;

  constructor(adapters: readonly DirectByokAdapter[]) {
    const byId = new Map<string, DirectByokAdapter>();
    for (const adapter of adapters) {
      if (
        adapter.transport !== "direct-only" ||
        adapter.supportsBrowserCors !== true
      ) {
        throw new TypeError("Registry accepts reviewed direct BYOK adapters only.");
      }
      if (byId.has(adapter.id)) {
        throw new TypeError(`Duplicate BYOK provider id: ${adapter.id}`);
      }
      byId.set(adapter.id, adapter);
    }
    this.#adapters = Object.freeze([...adapters]);
    this.#byId = byId;
    Object.freeze(this);
  }

  list(): readonly DirectByokAdapter[] {
    return this.#adapters;
  }

  get(providerId: string): DirectByokAdapter | undefined {
    return this.#byId.get(providerId);
  }
}

export function createDirectByokRegistry(
  adapters: readonly DirectByokAdapter[] = [],
): DirectByokRegistry {
  return new ImmutableDirectByokRegistry(adapters);
}

/** No provider is approved by default. Admission requires a code review. */
export const directByokRegistry: DirectByokRegistry =
  createDirectByokRegistry();

