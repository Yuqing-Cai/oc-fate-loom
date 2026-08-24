import { describe, expect, it } from "vitest";
import type { FateGraph } from "../domain/types";
import type { FateAnalysis, LocalizedText } from "./contracts";
import { APP_COPY } from "./copy";
import { buildStructurePreview, generateStructurePreview } from "./preview";
import { createInitialAppState, reduceAppState } from "./state";

const t = (zh: string, en: string): LocalizedText => ({ zh, en });

const OPEN_ANALYSIS: FateAnalysis = {
  edges: [
    {
      id: "edge-motive-choice",
      from: "motive-protect",
      to: "choice-refuse-order",
      kind: "causal",
      rationale: t("保护欲迫使他违抗命令。", "The need to protect forces him to defy the order."),
    },
    {
      id: "edge-boundary-choice",
      from: "boundary-no-captivity",
      to: "choice-refuse-order",
      kind: "support",
      rationale: t("她明确的边界使违抗成为共同决定。", "Her explicit boundary makes defiance a shared decision."),
    },
  ],
  conflicts: [
    {
      id: "conflict-power-consent",
      severity: "warning",
      optionIds: ["power-absolute", "boundary-no-captivity"],
      message: t("绝对权力会持续挤压她的退出权。", "Absolute power keeps eroding her right to leave."),
      repair: t("补充可执行的退出机制。", "Add an enforceable exit mechanism."),
    },
  ],
  gaps: [
    {
      id: "gap-cost",
      priority: "required",
      targetAxisId: "fate.cost",
      message: t("违抗命令尚未产生可见代价。", "Defying the order has no visible cost yet."),
      suggestion: t("选择一种双方都必须承担的损失。", "Choose a loss both characters must bear."),
    },
  ],
  paths: [
    {
      id: "path-choice-cost-ending",
      status: "open",
      edgeIds: ["edge-motive-choice"],
      summary: t("抉择已发生，但代价与终局仍未承接。", "The choice exists, but cost and ending remain unsupported."),
    },
  ],
  closure: { activePathCount: 1, closedPathIds: [], isFullyClosed: false },
};

const CLOSED_ANALYSIS: FateAnalysis = {
  ...OPEN_ANALYSIS,
  gaps: [],
  paths: [
    {
      id: "path-choice-cost-ending",
      status: "closed",
      edgeIds: ["edge-motive-choice", "edge-cost-ending"],
      summary: t("违抗、共同代价与离开旧秩序构成闭合路径。", "Defiance, shared cost, and leaving the old order form a closed path."),
    },
  ],
  closure: { activePathCount: 1, closedPathIds: ["path-choice-cost-ending"], isFullyClosed: true },
};

const DOMAIN_GRAPH: FateGraph = {
  selections: { "roleA.goal": "motive-protect", "roleA.choice": "choice-refuse-order" },
  nodes: [],
  edges: [
    {
      id: "edge-domain",
      ruleId: "rule-domain",
      source: "motive-protect",
      target: "choice-refuse-order",
      kind: "causal",
      label: t("保护导向违抗", "Protection leads to defiance"),
    },
  ],
  relations: [
    {
      id: "relation-domain",
      ruleId: "rule-domain",
      kind: "causal",
      optionIds: ["motive-protect", "choice-refuse-order"],
      label: t("保护导向违抗", "Protection leads to defiance"),
      rationale: t("保护目标使服从不再可行。", "The protection goal makes obedience untenable."),
    },
  ],
  gaps: [
    {
      id: "gap-domain",
      pathId: "choice-cost-ending",
      activatedBy: ["choice-refuse-order"],
      requiredAxis: "fate.cost",
      acceptableOptions: null,
      selectedOption: null,
      blocking: true,
      message: t("违抗仍需要代价承接。", "Defiance still needs a cost."),
    },
  ],
  conflicts: [],
  closure: {
    status: "open",
    isClosed: false,
    reasons: [t("抉择路径缺少代价。", "The choice path lacks a cost.")],
  },
};

describe("offline structure check", () => {
  it("builds an open outline from links, conflicts, gaps, and closure", () => {
    const state = createInitialAppState({ seed: "audit-seed" });
    const result = buildStructurePreview(state, OPEN_ANALYSIS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.preview.kind).toBe("structure-preview");
    expect(result.preview.name.zh).toBeTruthy();
    expect(result.preview.name.en).toBeTruthy();
    expect(result.preview.disclaimer.zh).toContain("故事正文");
    expect(result.preview.disclaimer.en).toContain("story prose");
    expect(result.preview.status).toBe("open");
    expect(result.preview.metrics).toEqual({
      edgeCount: 2,
      conflictCount: 1,
      gapCount: 1,
      activePathCount: 1,
      closedPathCount: 0,
    });

    const edges = result.preview.sections.find((section) => section.id === "edges");
    const conflicts = result.preview.sections.find((section) => section.id === "conflicts");
    const gaps = result.preview.sections.find((section) => section.id === "gaps");
    const closure = result.preview.sections.find((section) => section.id === "closure");
    expect(edges?.items.map((item) => item.text.zh)).toContain("保护欲迫使他违抗命令。");
    expect(conflicts?.items[0]?.text.zh).toContain("退出机制");
    expect(conflicts?.items[0]?.meta?.zh).toContain("退出权");
    expect(gaps?.items[0]?.text.zh).toContain("代价");
    expect(closure?.summary.zh).toContain("没有一条走到底");
  });

  it("allows gaps in outline mode but blocks full mode without a closed fate path", () => {
    const outline = createInitialAppState();
    expect(buildStructurePreview(outline, OPEN_ANALYSIS).ok).toBe(true);

    const full = reduceAppState(outline, { type: "set-output-mode", outputMode: "full" });
    const result = buildStructurePreview(full, OPEN_ANALYSIS);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues).toEqual([
      expect.objectContaining({ code: "FULL_REQUIRES_CLOSED_PATH" }),
    ]);
    expect(result.issues[0]?.message.zh).toBeTruthy();
    expect(result.issues[0]?.message.en).toBeTruthy();
  });

  it("builds full mode once every active path is closed", () => {
    const full = reduceAppState(createInitialAppState(), { type: "set-output-mode", outputMode: "full" });
    const result = buildStructurePreview(full, CLOSED_ANALYSIS);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.preview.status).toBe("closed");
    expect(result.preview.metrics.closedPathCount).toBe(1);
    expect(result.preview.sections[0]?.summary.zh).toContain("走通");
  });

  it("blocks full mode when one of several active paths remains open", () => {
    const full = reduceAppState(createInitialAppState(), { type: "set-output-mode", outputMode: "full" });
    const result = buildStructurePreview(full, {
      ...CLOSED_ANALYSIS,
      paths: [
        ...CLOSED_ANALYSIS.paths,
        {
          id: "path-still-open",
          status: "open",
          edgeIds: [],
          summary: t("另一条路还没接完。", "Another path is still open."),
        },
      ],
      closure: {
        activePathCount: 2,
        closedPathIds: ["path-choice-cost-ending"],
        isFullyClosed: false,
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.issues[0]?.code).toBe("FULL_REQUIRES_CLOSED_PATH");
  });

  it("uses the seed to produce a reproducible presentation order", () => {
    const first = buildStructurePreview(createInitialAppState({ seed: "stable" }), OPEN_ANALYSIS);
    const second = buildStructurePreview(createInitialAppState({ seed: "stable" }), {
      ...OPEN_ANALYSIS,
      edges: [...OPEN_ANALYSIS.edges].reverse(),
    });
    expect(first).toEqual(second);
  });

  it.each([
    [0, 0, "没有冲突把路截断。"],
    [1, 0, "1 处冲突把路截断了。"],
    [0, 2, "没有冲突截断路径；还有 2 处提醒可以一并看看。"],
    [1, 2, "1 处冲突把路截断；另有 2 处提醒不会截断路径。"],
  ])("writes conflict counts without empty bookkeeping (%i, %i)", (blocking, warning, expectedZh) => {
    const copy = APP_COPY.preview.conflictSummary(blocking, warning);
    expect(copy.zh).toBe(expectedZh);
    expect(copy.en).toBeTruthy();
  });

  it.each([
    [0, 0, "眼下没有绕不过去的缺口。"],
    [1, 0, "1 项不补就接不上。"],
    [0, 2, "没有非补不可的地方；还有 2 项可以以后再想。"],
    [1, 2, "1 项不补就接不上；另有 2 项可以以后再想。"],
  ])("writes gap counts without empty bookkeeping (%i, %i)", (required, recommended, expectedZh) => {
    const copy = APP_COPY.preview.gapSummary(required, recommended);
    expect(copy.zh).toBe(expectedZh);
    expect(copy.en).toBeTruthy();
  });

  it("adapts the domain graph directly and uses strict graph closure for full mode", () => {
    const outlineResult = generateStructurePreview(createInitialAppState(), DOMAIN_GRAPH);
    expect(outlineResult.ok).toBe(true);
    if (!outlineResult.ok) return;
    expect(outlineResult.preview.route).toBe("offline");
    expect(outlineResult.preview.sections.find((section) => section.id === "edges")?.items[0]?.text.zh).toBe(
      "保护目标使服从不再可行。",
    );

    const full = reduceAppState(createInitialAppState(), { type: "set-output-mode", outputMode: "full" });
    expect(generateStructurePreview(full, DOMAIN_GRAPH).ok).toBe(false);
    expect(
      generateStructurePreview(full, {
        ...DOMAIN_GRAPH,
        gaps: [],
        closure: {
          status: "closed",
          isClosed: true,
          reasons: [t("抉择、代价与终局均有承接。", "Choice, cost, and ending are all supported.")],
        },
      }).ok,
    ).toBe(true);
  });
});
