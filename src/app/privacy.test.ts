import { describe, expect, it } from "vitest";
import { collectStaticCopy } from "./copy";
import {
  clearSavedDraft,
  decodeDraft,
  disableDraftSaving,
  DRAFT_STORAGE_KEY,
  loadDraft,
  persistDraft,
  type StorageLike,
} from "./persistence";
import { createRouteCatalog, planRoute } from "./routes";
import { createEphemeralKeySession } from "./secrets";
import { createInitialAppState, reduceAppState } from "./state";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

describe("draft persistence", () => {
  it("persists disclosed draft fields but never has a place for the ephemeral key", () => {
    const storage = new MemoryStorage();
    let state = createInitialAppState({ seed: "repeatable", draftSavingEnabled: true });
    state = reduceAppState(state, { type: "select", axisId: "context.pressure", optionId: "war" });
    state = reduceAppState(state, { type: "set-provider", providerId: "approved" });
    persistDraft(storage, state);

    const raw = storage.getItem(DRAFT_STORAGE_KEY);
    expect(raw).not.toBeNull();
    expect(raw).not.toMatch(/apiKey|api_key|secret/i);
    expect(loadDraft(storage)).toMatchObject({
      seed: "repeatable",
      selections: { "context.pressure": "war" },
      connection: { providerId: "approved", modelId: "" },
    });
  });

  it("can disable saving and clear the stored draft in one action", () => {
    const storage = new MemoryStorage();
    const state = createInitialAppState({ draftSavingEnabled: true });
    persistDraft(storage, state);
    const disabled = disableDraftSaving(storage, state);

    expect(disabled.draftSavingEnabled).toBe(false);
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
    persistDraft(storage, disabled);
    expect(storage.getItem(DRAFT_STORAGE_KEY)).toBeNull();
  });

  it("supports an explicit clear and treats corrupt or incompatible drafts as untrusted", () => {
    const storage = new MemoryStorage();
    const fallback = createInitialAppState({ locale: "en", seed: "safe", draftSavingEnabled: true });
    expect(decodeDraft("not json", fallback)).toBe(fallback);
    expect(decodeDraft('{"version":999}', fallback)).toBe(fallback);

    persistDraft(storage, fallback);
    clearSavedDraft(storage);
    expect(loadDraft(storage, fallback)).toBe(fallback);
  });
});

describe("ephemeral BYOK key", () => {
  it("lives only in an isolated in-memory session and can be destroyed", () => {
    const session = createEphemeralKeySession();
    const state = createInitialAppState();
    session.set("sk-visitor-only");
    expect(session.has()).toBe(true);
    expect(session.withKey((value) => value)).toBe("sk-visitor-only");
    expect(JSON.stringify(state)).not.toContain("sk-visitor-only");
    session.clear();
    expect(session.has()).toBe(false);
    expect(() => session.withKey((value) => value)).toThrow("No transient API key");
  });
});

describe("generation routes", () => {
  it("always enables offline while default and BYOK are unavailable with reasons", () => {
    const catalog = createRouteCatalog();
    expect(catalog.offline.available).toBe(true);
    expect(catalog.offline.unavailableReason).toBeUndefined();
    for (const route of [catalog.default, catalog.byok]) {
      expect(route.available).toBe(false);
      expect(route.unavailableReason?.zh).not.toBe("");
      expect(route.unavailableReason?.en).not.toBe("");
    }
    expect(planRoute(createInitialAppState(), catalog)).toEqual({ route: "offline", ready: true, blocks: [] });
  });

  it("requires provider, model, and an external in-memory key only after BYOK is enabled", () => {
    const catalog = createRouteCatalog({ byok: { available: true } });
    let state = reduceAppState(createInitialAppState(), { type: "set-route", route: "byok" });
    expect(planRoute(state, catalog).blocks.map((block) => block.code)).toEqual([
      "PROVIDER_REQUIRED",
      "MODEL_REQUIRED",
      "EPHEMERAL_KEY_REQUIRED",
    ]);
    state = reduceAppState(state, { type: "set-provider", providerId: "approved" });
    state = reduceAppState(state, { type: "set-model", modelId: "model" });
    expect(planRoute(state, catalog, true)).toEqual({ route: "byok", ready: true, blocks: [] });
  });
});

describe("bilingual copy", () => {
  it("provides non-empty Chinese and English for every static string", () => {
    const copy = collectStaticCopy();
    expect(copy.length).toBeGreaterThan(20);
    for (const item of copy) {
      expect(item.zh.trim()).not.toBe("");
      expect(item.en.trim()).not.toBe("");
    }
  });
});
