const DEFAULT_SEED = "fate-loom";

export function normalizeSeed(seed: string): string {
  const normalized = seed.trim();
  return normalized.length > 0 ? normalized : DEFAULT_SEED;
}

export function hashSeed(seed: string): number {
  let hash = 0x811c9dc5;
  for (const character of normalizeSeed(seed)) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createSeededRandom(seed: string): () => number {
  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

export function seededOrder<T>(items: readonly T[], seed: string, identity: (item: T) => string): T[] {
  return [...items].sort((left, right) => {
    const leftHash = hashSeed(`${normalizeSeed(seed)}:${identity(left)}`);
    const rightHash = hashSeed(`${normalizeSeed(seed)}:${identity(right)}`);
    return leftHash - rightHash || identity(left).localeCompare(identity(right));
  });
}

export function nextSeed(seed: string): string {
  return `${normalizeSeed(seed)}-${hashSeed(`${normalizeSeed(seed)}:next`).toString(36)}`;
}
