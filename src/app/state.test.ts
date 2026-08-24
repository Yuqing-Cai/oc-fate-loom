import { describe, expect, it } from "vitest";
import { createExportedConfiguration, exportFileName, serializeConfiguration } from "./export";
import { createSeededRandom, nextSeed, normalizeSeed, seededOrder } from "./random";
import { createInitialAppState, reduceAppState, selectedOptionIds } from "./state";

describe("app state", () => {
  it("starts on the always-safe offline outline route", () => {
    const state = createInitialAppState();
    expect(state.route).toBe("offline");
    expect(state.outputMode).toBe("outline");
    expect(state.draftSavingEnabled).toBe(false);
    expect(state).not.toHaveProperty("apiKey");
    expect(state).not.toHaveProperty("key");
  });

  it("updates selections without mutating the previous state", () => {
    const start = createInitialAppState();
    const withWorld = reduceAppState(start, { type: "select", axisId: "context.pressure", optionId: "war" });
    const withMotive = reduceAppState(withWorld, { type: "select", axisId: "roleA.goal", optionId: "protect" });
    expect(start.selections).toEqual({});
    expect(withWorld.selections).toEqual({ "context.pressure": "war" });
    expect(selectedOptionIds(withMotive)).toEqual(["war", "protect"]);
  });

  it("globally clears creative and connection configuration but preserves explicit privacy preferences", () => {
    let state = createInitialAppState({ locale: "en", draftSavingEnabled: false, seed: "custom" });
    state = reduceAppState(state, { type: "select", axisId: "context.pressure", optionId: "war" });
    state = reduceAppState(state, { type: "set-notes", notes: "private draft note" });
    state = reduceAppState(state, { type: "set-route", route: "byok" });
    state = reduceAppState(state, { type: "set-provider", providerId: "provider" });
    state = reduceAppState(state, { type: "set-model", modelId: "model" });

    const cleared = reduceAppState(state, { type: "clear-all" });
    expect(cleared).toMatchObject({
      locale: "en",
      draftSavingEnabled: false,
      route: "offline",
      outputMode: "outline",
      notes: "",
      selections: {},
      connection: { providerId: "", modelId: "" },
    });
  });
});

describe("reproducible seed", () => {
  it("normalizes an empty seed and reproduces a random sequence", () => {
    expect(normalizeSeed("   ")).toBe("fate-loom");
    const left = createSeededRandom("same-seed");
    const right = createSeededRandom("same-seed");
    expect([left(), left(), left()]).toEqual([right(), right(), right()]);
  });

  it("orders values deterministically without depending on input order", () => {
    const items = [{ id: "a" }, { id: "b" }, { id: "c" }, { id: "d" }];
    const ordered = seededOrder(items, "seed", (item) => item.id).map((item) => item.id);
    const reversed = seededOrder([...items].reverse(), "seed", (item) => item.id).map((item) => item.id);
    expect(reversed).toEqual(ordered);
    expect(nextSeed("seed")).toBe(nextSeed("seed"));
  });
});

describe("configuration export", () => {
  it("is stable, explicit about privacy, and cannot contain an API key field", () => {
    let state = createInitialAppState({ seed: "my seed" });
    state = reduceAppState(state, { type: "select", axisId: "roleB.goal", optionId: "last" });
    state = reduceAppState(state, { type: "select", axisId: "roleA.goal", optionId: "first" });
    state = reduceAppState(state, { type: "set-provider", providerId: "openai-compatible" });
    state = reduceAppState(state, { type: "set-model", modelId: "model-id" });

    const document = createExportedConfiguration(state);
    const serialized = serializeConfiguration(state);
    expect(Object.keys(document.selections)).toEqual(["roleA.goal", "roleB.goal"]);
    expect(document.privacy).toEqual({
      dedicatedApiKeyFieldIncluded: false,
      freeTextNotesIncluded: true,
    });
    expect(serialized).not.toContain("sk-visitor-only");
    expect(document).not.toHaveProperty("apiKey");
    expect(serializeConfiguration(state)).toBe(serialized);
    expect(exportFileName(state)).toBe("oc-fate-loom-my-seed.json");
  });
});
