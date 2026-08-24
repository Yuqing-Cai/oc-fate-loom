export interface LifecycleEventTarget {
  addEventListener(type: "pageshow" | "pagehide", listener: () => void): void;
  removeEventListener(type: "pageshow" | "pagehide", listener: () => void): void;
}

export interface TransientKeyHolder {
  set(value: string): void;
  clear(): void;
  has(): boolean;
  withKey<T>(consumer: (value: string) => T): T;
}

/**
 * A closure-backed holder exposes no getter and has no serialization path.
 * The application must never put this value in app state or browser storage.
 */
export function createTransientKeyHolder(): TransientKeyHolder {
  let current = "";

  return Object.freeze({
    set(value: string): void {
      if (!value.trim() || value.length > 4_096) {
        current = "";
        throw new TypeError("Transient API key is invalid.");
      }
      current = value;
    },
    clear(): void {
      current = "";
    },
    has(): boolean {
      return current.length > 0;
    },
    withKey<T>(consumer: (value: string) => T): T {
      if (!current) {
        throw new Error("No transient API key is present.");
      }
      return consumer(current);
    },
  });
}

export function bindTransientKeyLifecycle(
  holder: TransientKeyHolder,
  target: LifecycleEventTarget = window,
): () => void {
  const clear = (): void => holder.clear();
  target.addEventListener("pageshow", clear);
  target.addEventListener("pagehide", clear);

  return (): void => {
    target.removeEventListener("pageshow", clear);
    target.removeEventListener("pagehide", clear);
    holder.clear();
  };
}

