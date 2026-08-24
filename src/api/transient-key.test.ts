import { describe, expect, it } from "vitest";

import {
  bindTransientKeyLifecycle,
  createTransientKeyHolder,
  type LifecycleEventTarget,
} from "./transient-key";

class FakeLifecycleTarget implements LifecycleEventTarget {
  readonly listeners = new Map<string, Set<() => void>>();

  addEventListener(type: "pageshow" | "pagehide", listener: () => void): void {
    const listeners = this.listeners.get(type) ?? new Set<() => void>();
    listeners.add(listener);
    this.listeners.set(type, listeners);
  }

  removeEventListener(
    type: "pageshow" | "pagehide",
    listener: () => void,
  ): void {
    this.listeners.get(type)?.delete(listener);
  }

  dispatch(type: "pageshow" | "pagehide"): void {
    for (const listener of this.listeners.get(type) ?? []) listener();
  }
}

describe("transient key holder", () => {
  it("keeps a key only inside the closure-backed callback surface", () => {
    const holder = createTransientKeyHolder();
    holder.set("temporary-secret");
    expect(holder.has()).toBe(true);
    expect(holder.withKey((value) => value.length)).toBe(16);
    expect(Object.keys(holder)).not.toContain("get");
    expect(JSON.stringify(holder)).not.toContain("temporary-secret");
    holder.clear();
    expect(holder.has()).toBe(false);
  });

  it.each(["pageshow", "pagehide"] as const)(
    "clears on %s",
    (eventName) => {
      const target = new FakeLifecycleTarget();
      const holder = createTransientKeyHolder();
      const dispose = bindTransientKeyLifecycle(holder, target);
      holder.set("temporary-secret");
      target.dispatch(eventName);
      expect(holder.has()).toBe(false);
      dispose();
    },
  );

  it("clears and detaches listeners on disposal", () => {
    const target = new FakeLifecycleTarget();
    const holder = createTransientKeyHolder();
    const dispose = bindTransientKeyLifecycle(holder, target);
    holder.set("temporary-secret");
    dispose();
    expect(holder.has()).toBe(false);
    expect(target.listeners.get("pageshow")?.size).toBe(0);
    expect(target.listeners.get("pagehide")?.size).toBe(0);
  });
});

