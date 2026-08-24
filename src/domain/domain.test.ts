import { describe, expect, it } from "vitest";

import {
  AXES,
  CHAPTERS,
  DEFAULT_ROLE_PRESENTATION,
  FATE_RULES,
  NARRATIVE_AXIS_IDS,
  PATH_REQUIREMENTS,
  deriveFateGraph,
  getAxis,
  getOption,
  isValidSelection,
  normalizeSelections,
} from "./index";
import type { AxisId, LocalizedText, SelectionMap } from "./types";

const expectLocalized = (value: LocalizedText): void => {
  expect(value.zh.trim()).not.toBe("");
  expect(value.en.trim()).not.toBe("");
};

const completeSelections = (overrides: SelectionMap = {}): SelectionMap => {
  const selected = Object.fromEntries(
    AXES
      .filter((axis) => axis.chapter !== "palette")
      .map((axis) => [axis.id, axis.options[0]?.id]),
  ) as SelectionMap;
  return { ...selected, ...overrides };
};

describe("content model", () => {
  it("keeps five ordered creative chapters and a full two-character workflow", () => {
    expect(CHAPTERS.map((chapter) => chapter.id)).toEqual([
      "context",
      "characters",
      "relationship",
      "fate",
      "palette",
    ]);
    expect(NARRATIVE_AXIS_IDS).toHaveLength(16);
    expect(AXES).toHaveLength(17);

    for (const role of ["roleA", "roleB"] as const) {
      expect(AXES.filter((axis) => axis.role === role).map((axis) => axis.dimension)).toEqual([
        "goal",
        "stance",
        "boundary",
        "vulnerability",
        "choice",
      ]);
    }
  });

  it("is internally roleA/roleB while its default presentation is she/he", () => {
    expect(DEFAULT_ROLE_PRESENTATION.roleA.id).toBe("roleA");
    expect(DEFAULT_ROLE_PRESENTATION.roleB.id).toBe("roleB");
    expect(DEFAULT_ROLE_PRESENTATION.roleA.subject).toEqual({ zh: "她", en: "she" });
    expect(DEFAULT_ROLE_PRESENTATION.roleB.subject).toEqual({ zh: "他", en: "he" });
    expect(getAxis("roleA.goal")?.label.zh).toContain("她");
    expect(getAxis("roleB.goal")?.label.zh).toContain("他");
  });

  it("keeps both role schemas semantically symmetric", () => {
    for (const dimension of ["goal", "stance", "boundary", "vulnerability", "choice"] as const) {
      const roleA = getAxis(`roleA.${dimension}`);
      const roleB = getAxis(`roleB.${dimension}`);
      expect(roleA).toBeDefined();
      expect(roleB).toBeDefined();
      expect(roleA?.options.map((option) => option.semanticKey)).toEqual(
        roleB?.options.map((option) => option.semanticKey),
      );
      expect(roleA?.options.map((option) => option.label)).toEqual(
        roleB?.options.map((option) => option.label),
      );
      expect(roleA?.options.map((option) => option.riskTags)).toEqual(
        roleB?.options.map((option) => option.riskTags),
      );
    }
  });

  it("provides complete Chinese and English copy everywhere", () => {
    for (const chapter of CHAPTERS) {
      expectLocalized(chapter.label);
      expectLocalized(chapter.eyebrow);
      expectLocalized(chapter.description);
    }

    for (const axis of AXES) {
      expect(axis.selectionMode).toBe("single");
      expectLocalized(axis.label);
      expectLocalized(axis.shortLabel);
      expectLocalized(axis.question);
      expectLocalized(axis.description);
      expect(axis.options.length).toBeGreaterThanOrEqual(4);
      for (const option of axis.options) {
        expectLocalized(option.label);
        expectLocalized(option.summary);
        expectLocalized(option.detail);
      }
    }

    for (const rule of FATE_RULES) {
      expectLocalized(rule.label);
      expectLocalized(rule.rationale);
    }
    for (const requirement of PATH_REQUIREMENTS) {
      expectLocalized(requirement.message);
    }
  });

  it("has unique IDs and only references existing option IDs", () => {
    const axisIds = AXES.map((axis) => axis.id);
    const options = AXES.flatMap((axis) => axis.options);
    const optionIds = options.map((option) => option.id);
    expect(new Set(axisIds).size).toBe(axisIds.length);
    expect(new Set(optionIds).size).toBe(optionIds.length);
    expect(new Set(FATE_RULES.map((rule) => rule.id)).size).toBe(FATE_RULES.length);
    expect(new Set(PATH_REQUIREMENTS.map((requirement) => requirement.id)).size).toBe(PATH_REQUIREMENTS.length);

    for (const rule of FATE_RULES) {
      for (const optionId of [...rule.whenAll, ...rule.sources, rule.target]) {
        expect(getOption(optionId), `${rule.id} references ${optionId}`).toBeDefined();
      }
      expect(rule.whenAll).toContain(rule.target);
      for (const source of rule.sources) {
        expect(rule.whenAll).toContain(source);
      }
      expect(new Set(rule.whenAll.map((optionId) => getOption(optionId)?.axisId)).size).toBe(
        rule.whenAll.length,
      );
    }
    for (const requirement of PATH_REQUIREMENTS) {
      expect(getAxis(requirement.requiredAxis)).toBeDefined();
      for (const optionId of [
        ...(requirement.whenAny ?? []),
        ...(requirement.whenAll ?? []),
        ...(requirement.acceptableOptions ?? []),
      ]) {
        expect(getOption(optionId), `${requirement.id} references ${optionId}`).toBeDefined();
      }
      for (const optionId of requirement.acceptableOptions ?? []) {
        expect(getOption(optionId)?.axisId).toBe(requirement.requiredAxis);
      }
    }

    const ruleSignatures = FATE_RULES.map((rule) =>
      `${rule.kind}:${[...rule.whenAll].sort().join("|")}`,
    );
    expect(new Set(ruleSignatures).size).toBe(ruleSignatures.length);
  });

  it("does not use mental-illness shorthand as a romance danger scale", () => {
    const allCopy = JSON.stringify({ CHAPTERS, AXES }).toLowerCase();
    for (const banned of ["sanity", "crazy", "madness", "精神病", "疯癫", "疯子"]) {
      expect(allCopy).not.toContain(banned);
    }
  });

  it("represents every relation class with option-level rules", () => {
    expect(new Set(FATE_RULES.map((rule) => rule.kind))).toEqual(
      new Set(["support", "tension", "conflict", "causal", "open"]),
    );
    expect(FATE_RULES.every((rule) => rule.whenAll.length >= 2)).toBe(true);
  });
});

describe("selection validation", () => {
  it("accepts only an option that belongs to its axis", () => {
    const pressure = "context.pressure.siege";
    expect(isValidSelection("context.pressure", pressure)).toBe(true);
    expect(isValidSelection("context.clock", pressure)).toBe(false);
    expect(normalizeSelections({
      "context.pressure": pressure,
      "context.clock": pressure,
    })).toEqual({ "context.pressure": pressure });
  });
});

describe("option-level fate graph", () => {
  it("does not infer a relation merely because two axes are present", () => {
    const exact = deriveFateGraph({
      "context.clock": "context.clock.a_long_b_mortal",
      "fate.cost": "fate.cost.time",
    });
    expect(exact.relations.some((relation) => relation.ruleId === "clock-a-long-cost-time")).toBe(true);

    const sameAxesDifferentOptions = deriveFateGraph({
      "context.clock": "context.clock.shared_mortal",
      "fate.cost": "fate.cost.time",
    });
    expect(sameAxesDifferentOptions.relations.some((relation) => relation.kind === "causal")).toBe(false);
  });

  it("keeps a partially supported route open instead of declaring closure", () => {
    const graph = deriveFateGraph({
      "context.pressure": "context.pressure.exposure",
      "roleA.goal": "roleA.goal.truth",
    });
    expect(graph.edges.some((edge) => edge.kind === "causal")).toBe(true);
    expect(graph.gaps.length).toBeGreaterThan(0);
    expect(graph.closure).toMatchObject({ status: "open", isClosed: false });
  });

  it("never vacuously closes on one character option or palette alone", () => {
    expect(deriveFateGraph({ "roleA.goal": "roleA.goal.freedom" }).closure).toMatchObject({
      status: "open",
      isClosed: false,
    });
    expect(deriveFateGraph({ "prose.palette": "prose.palette.restrained" }).closure).toMatchObject({
      status: "inactive",
      isClosed: false,
    });
  });

  it("closes only when the whole activated workflow has no blocking gap", () => {
    const complete = deriveFateGraph(completeSelections());
    expect(complete.gaps).toEqual([]);
    expect(complete.conflicts).toEqual([]);
    expect(complete.closure).toMatchObject({ status: "closed", isClosed: true });
    expect(complete.paths?.find((path) => path.id === "story-weave")).toMatchObject({
      kind: "core",
      status: "closed",
      terminalOptionId: "fate.ending.shared_life",
    });

    const lifespanNotCarried = deriveFateGraph(completeSelections({
      "context.clock": "context.clock.a_long_b_mortal",
      "fate.cost": "fate.cost.status",
    }));
    expect(lifespanNotCarried.gaps.some((gap) => gap.id === "gap:lifespan-gap-needs-carrying-cost")).toBe(true);
    expect(lifespanNotCarried.closure.isClosed).toBe(false);

    const lifespanCarried = deriveFateGraph(completeSelections({
      "context.pressure": "context.pressure.crossing",
      "context.clock": "context.clock.a_long_b_mortal",
      "roleA.vulnerability": "roleA.vulnerability.time",
      "roleB.vulnerability": "roleB.vulnerability.time",
      "relationship.bond": "relationship.bond.mutual_change",
      "fate.cost": "fate.cost.time",
      "fate.ending": "fate.ending.rewrite_cycle",
    }));
    expect(lifespanCarried.gaps).toEqual([]);
    expect(lifespanCarried.closure.isClosed).toBe(true);
    expect(lifespanCarried.paths?.map((path) => [path.id, path.status])).toEqual([
      ["story-weave", "closed"],
      ["lifespan-gap", "closed"],
    ]);
    expect(lifespanCarried.closure).toMatchObject({
      activePathCount: 2,
      closedPathCount: 2,
      closedPathIds: ["story-weave", "lifespan-gap"],
    });
  });

  it("never calls a filled but relation-free configuration closed", () => {
    const graph = deriveFateGraph(completeSelections({
      "context.pressure": "context.pressure.institution",
      "context.clock": "context.clock.shared_mortal",
      "roleA.goal": "roleA.goal.freedom",
      "roleA.stance": "roleA.stance.reform",
      "roleA.boundary": "roleA.boundary.body",
      "roleA.vulnerability": "roleA.vulnerability.attachment",
      "roleA.choice": "roleA.choice.refuse",
      "roleB.goal": "roleB.goal.freedom",
      "roleB.stance": "roleB.stance.reform",
      "roleB.boundary": "roleB.boundary.body",
      "roleB.vulnerability": "roleB.vulnerability.attachment",
      "roleB.choice": "roleB.choice.refuse",
      "relationship.power": "relationship.power.balanced",
      "relationship.bond": "relationship.bond.protective_dependency",
      "fate.cost": "fate.cost.memory",
      "fate.ending": "fate.ending.parting",
    }));
    expect(graph.gaps).toEqual([]);
    expect(graph.conflicts).toEqual([]);
    expect(graph.edges).toEqual([]);
    expect(graph.paths?.[0]).toMatchObject({ id: "story-weave", status: "open" });
    expect(graph.closure).toMatchObject({ status: "open", isClosed: false });
  });

  it("does not use tension or open relations as closure-carrying edges", () => {
    const graph = deriveFateGraph(completeSelections({
      "context.pressure": "context.pressure.institution",
      "context.clock": "context.clock.shared_mortal",
      "roleA.goal": "roleA.goal.freedom",
      "roleA.stance": "roleA.stance.reform",
      "roleA.boundary": "roleA.boundary.body",
      "roleA.vulnerability": "roleA.vulnerability.attachment",
      "roleA.choice": "roleA.choice.refuse",
      "roleB.goal": "roleB.goal.freedom",
      "roleB.stance": "roleB.stance.reform",
      "roleB.boundary": "roleB.boundary.body",
      "roleB.vulnerability": "roleB.vulnerability.attachment",
      "roleB.choice": "roleB.choice.refuse",
      "relationship.power": "relationship.power.balanced",
      "relationship.bond": "relationship.bond.protective_dependency",
      "fate.cost": "fate.cost.memory",
      "fate.ending": "fate.ending.unresolved",
    }));
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.edges.every((edge) => edge.kind === "open" || edge.kind === "tension")).toBe(true);
    expect(graph.paths?.[0]?.relationIds).toEqual([]);
    expect(graph.closure.isClosed).toBe(false);
  });

  it("keeps a filled specialized path open when it has only tension rules", () => {
    const graph = deriveFateGraph(completeSelections({
      "roleA.boundary": "roleA.boundary.truth",
      "roleB.boundary": "roleB.boundary.truth",
      "relationship.bond": "relationship.bond.possession",
    }));
    expect(graph.gaps.filter((gap) => gap.pathId === "possession-boundary")).toEqual([]);
    expect(graph.conflicts).toEqual([]);
    expect(graph.paths?.find((path) => path.id === "possession-boundary")).toMatchObject({
      status: "open",
    });
    expect(graph.closure.isClosed).toBe(false);
  });

  it("exposes all-of prerequisite junctions instead of treating sources as sufficient alone", () => {
    const graph = deriveFateGraph(completeSelections());
    const relation = graph.relations.find((item) => item.ruleId === "goals-both-protect-bond-negotiated");
    const junction = graph.junctions?.find((item) => item.ruleId === relation?.ruleId);
    expect(relation).toMatchObject({
      prerequisiteMode: "all",
      sources: ["roleA.goal.protect", "roleB.goal.protect"],
      target: "relationship.bond.negotiated",
    });
    expect(junction).toMatchObject({
      prerequisiteMode: "all",
      sources: ["roleA.goal.protect", "roleB.goal.protect"],
      target: "relationship.bond.negotiated",
    });
    const groupedEdges = graph.edges.filter((edge) => edge.relationId === relation?.id);
    expect(groupedEdges).toHaveLength(2);
    expect(groupedEdges.every((edge) => edge.sourceCount === 2 && edge.prerequisiteMode === "all")).toBe(true);

    const onePrerequisiteMissing = deriveFateGraph(completeSelections({
      "roleB.goal": "roleB.goal.freedom",
    }));
    expect(onePrerequisiteMissing.relations.some((item) => item.ruleId === relation?.ruleId)).toBe(false);
    expect(onePrerequisiteMissing.junctions?.some((item) => item.ruleId === relation?.ruleId)).toBe(false);
  });

  it("blocks a direct cost/ending contradiction", () => {
    const graph = deriveFateGraph(completeSelections({
      "fate.cost": "fate.cost.separation",
      "fate.ending": "fate.ending.shared_life",
    }));
    expect(graph.conflicts.map((conflict) => conflict.ruleId)).toContain("cost-separation-ending-shared");
    expect(graph.edges.some((edge) => edge.ruleId === "cost-separation-ending-shared")).toBe(false);
    expect(graph.closure).toMatchObject({ status: "blocked", isClosed: false });
  });

  it("treats possession against bodily autonomy as a conflict, not affection", () => {
    const graph = deriveFateGraph(completeSelections({
      "relationship.bond": "relationship.bond.possession",
    }));
    expect(graph.conflicts).toHaveLength(2);
    expect(graph.conflicts.every((conflict) => conflict.label.zh.includes("冲突"))).toBe(true);
    expect(graph.closure.isClosed).toBe(false);
  });

  it("emits every matched edge without a display cap and in stable order", () => {
    const selections = completeSelections({
      "context.pressure": "context.pressure.crossing",
      "context.clock": "context.clock.a_long_b_mortal",
      "roleA.boundary": "roleA.boundary.independence",
      "roleA.vulnerability": "roleA.vulnerability.time",
      "roleA.choice": "roleA.choice.third_path",
      "roleB.boundary": "roleB.boundary.independence",
      "roleB.vulnerability": "roleB.vulnerability.time",
      "roleB.choice": "roleB.choice.third_path",
      "relationship.bond": "relationship.bond.mutual_change",
      "fate.cost": "fate.cost.time",
      "fate.ending": "fate.ending.rewrite_cycle",
    });
    const first = deriveFateGraph(selections);
    const second = deriveFateGraph(selections);
    const expectedEdgeCount = first.relations
      .filter((relation) => relation.kind !== "conflict")
      .reduce((sum, relation) => {
        const matched = FATE_RULES.find((rule) => rule.id === relation.ruleId);
        return sum + (matched?.sources.length ?? 0);
      }, 0);

    expect(first.edges.length).toBe(expectedEdgeCount);
    expect(first.edges.length).toBeGreaterThan(8);
    expect(first.edges).toEqual(second.edges);
  });

  it("keeps every compatible rule edge acyclic by content order", () => {
    const optionOrder = new Map(
      AXES.flatMap((axis) => axis.options).map((option, index) => [option.id, index]),
    );
    for (const rule of FATE_RULES.filter((candidate) => candidate.kind !== "conflict")) {
      for (const source of rule.sources) {
        expect(
          optionOrder.get(source),
          `${rule.id}: ${source} must precede ${rule.target}`,
        ).toBeLessThan(optionOrder.get(rule.target) ?? -1);
      }
    }
  });

  it("sorts gaps by axis order and exposes wrong selections", () => {
    const graph = deriveFateGraph(completeSelections({
      "context.clock": "context.clock.a_long_b_mortal",
      "fate.cost": "fate.cost.status",
    }));
    const relevant = graph.gaps.find((gap) => gap.pathId === "lifespan-gap");
    expect(relevant).toMatchObject({
      requiredAxis: "fate.cost" satisfies AxisId,
      selectedOption: "fate.cost.status",
      blocking: true,
    });
  });
});
