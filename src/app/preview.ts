import { getOption } from "../domain/content";
import type { FateGraph, LocalizedText, MatchedRelation, RelationKind } from "../domain/types";
import type { FateAnalysis } from "./contracts";
import { APP_COPY } from "./copy";
import { seededOrder } from "./random";
import type { AppState } from "./state";

export type PreviewIssueCode = "FULL_REQUIRES_CLOSED_PATH";

export interface PreviewIssue {
  readonly code: PreviewIssueCode;
  readonly message: LocalizedText;
}

export type PreviewSectionId = "closure" | "edges" | "conflicts" | "gaps";

export interface PreviewItem {
  readonly id: string;
  readonly text: LocalizedText;
  readonly meta?: LocalizedText;
  readonly tone: "neutral" | "positive" | "warning" | "danger";
}

export interface PreviewSection {
  readonly id: PreviewSectionId;
  readonly title: LocalizedText;
  readonly summary: LocalizedText;
  readonly items: readonly PreviewItem[];
}

export interface StructurePreview {
  readonly kind: "structure-preview";
  readonly route: "offline";
  readonly name: LocalizedText;
  readonly disclaimer: LocalizedText;
  readonly seed: string;
  readonly mode: AppState["outputMode"];
  readonly status: "open" | "closed" | "conflicted";
  readonly sections: readonly PreviewSection[];
  readonly metrics: {
    readonly edgeCount: number;
    readonly conflictCount: number;
    readonly gapCount: number;
    readonly activePathCount: number;
    readonly closedPathCount: number;
  };
}

export type PreviewBuildResult =
  | { readonly ok: true; readonly preview: StructurePreview }
  | { readonly ok: false; readonly issues: readonly PreviewIssue[] };

const relationKindCopy: Readonly<Record<Exclude<RelationKind, "conflict">, LocalizedText>> = {
  causal: { zh: "因果", en: "cause" },
  support: { zh: "支持", en: "support" },
  tension: { zh: "张力", en: "tension" },
  open: { zh: "开放", en: "open" },
};

function optionNames(value: string): LocalizedText {
  const options = value.split(" + ").map((optionId) => getOption(optionId));
  return {
    zh: options.map((option, index) => option?.label.zh ?? value.split(" + ")[index]).join(" + "),
    en: options.map((option, index) => option?.label.en ?? value.split(" + ")[index]).join(" + "),
  };
}

export function previewEligibility(state: AppState, analysis: FateAnalysis): readonly PreviewIssue[] {
  if (state.outputMode === "full" && !analysis.closure.isFullyClosed) {
    return [{ code: "FULL_REQUIRES_CLOSED_PATH", message: APP_COPY.preview.fullNeedsClosedPath }];
  }
  return [];
}

function closureSummary(analysis: FateAnalysis): LocalizedText {
  const { activePathCount, closedPathIds, isFullyClosed } = analysis.closure;
  if (activePathCount === 0) return APP_COPY.preview.noActivePath;
  if (isFullyClosed) return APP_COPY.preview.fullClosure(closedPathIds.length);
  if (closedPathIds.length === 0) return APP_COPY.preview.noneClosed(activePathCount);
  return APP_COPY.preview.partialClosure(closedPathIds.length, activePathCount);
}

function closureItems(analysis: FateAnalysis, seed: string): readonly PreviewItem[] {
  const paths = seededOrder(analysis.paths, `${seed}:paths`, (path) => path.id);
  if (paths.length === 0) {
    return [{ id: "path:none", text: APP_COPY.preview.noActivePath, tone: "neutral" }];
  }
  return paths.map((path) => ({
    id: path.id,
    text: path.summary,
    meta:
      path.status === "closed"
        ? { zh: "这条路走通了", en: "This path runs through" }
        : path.status === "blocked"
          ? { zh: "被冲突截断", en: "Blocked by conflict" }
          : { zh: "还没走到底", en: "Still open" },
    tone: path.status === "closed" ? "positive" : path.status === "blocked" ? "danger" : "warning",
  }));
}

function edgeItems(analysis: FateAnalysis, seed: string): readonly PreviewItem[] {
  const edges = seededOrder(analysis.edges, `${seed}:edges`, (edge) => edge.id);
  if (edges.length === 0) {
    return [{ id: "edge:none", text: APP_COPY.preview.emptyEdges, tone: "neutral" }];
  }
  return edges.map((edge) => ({
    id: edge.id,
    text: edge.rationale,
    meta: {
      zh: `${optionNames(edge.from).zh} → ${optionNames(edge.to).zh} · ${relationKindCopy[edge.kind].zh}`,
      en: `${optionNames(edge.from).en} → ${optionNames(edge.to).en} · ${relationKindCopy[edge.kind].en}`,
    },
    tone: edge.kind === "tension" ? "warning" : edge.kind === "open" ? "neutral" : "positive",
  }));
}

function conflictItems(analysis: FateAnalysis, seed: string): readonly PreviewItem[] {
  const conflicts = seededOrder(analysis.conflicts, `${seed}:conflicts`, (conflict) => conflict.id);
  if (conflicts.length === 0) {
    return [{ id: "conflict:none", text: APP_COPY.preview.emptyConflicts, tone: "positive" }];
  }
  return conflicts.map((conflict) => ({
    id: conflict.id,
    text: conflict.repair ?? conflict.message,
    meta: conflict.repair === undefined ? undefined : conflict.message,
    tone: conflict.severity === "blocking" ? "danger" : "warning",
  }));
}

function gapItems(analysis: FateAnalysis, seed: string): readonly PreviewItem[] {
  const gaps = seededOrder(analysis.gaps, `${seed}:gaps`, (gap) => gap.id);
  if (gaps.length === 0) {
    return [{ id: "gap:none", text: APP_COPY.preview.emptyGaps, tone: "positive" }];
  }
  return gaps.map((gap) => ({
    id: gap.id,
    text: gap.message,
    meta: gap.suggestion,
    tone: gap.priority === "required" ? "danger" : "warning",
  }));
}

export function buildStructurePreview(state: AppState, analysis: FateAnalysis): PreviewBuildResult {
  const issues = previewEligibility(state, analysis);
  if (issues.length > 0) return { ok: false, issues };

  const blocking = analysis.conflicts.filter((item) => item.severity === "blocking").length;
  const warnings = analysis.conflicts.length - blocking;
  const required = analysis.gaps.filter((item) => item.priority === "required").length;
  const recommended = analysis.gaps.length - required;
  const status = blocking > 0 ? "conflicted" : analysis.closure.isFullyClosed ? "closed" : "open";

  return {
    ok: true,
    preview: {
      kind: "structure-preview",
      route: "offline",
      name: APP_COPY.preview.name,
      disclaimer: APP_COPY.preview.disclaimer,
      seed: state.seed,
      mode: state.outputMode,
      status,
      metrics: {
        edgeCount: analysis.edges.length,
        conflictCount: analysis.conflicts.length,
        gapCount: analysis.gaps.length,
        activePathCount: analysis.closure.activePathCount,
        closedPathCount: analysis.closure.closedPathIds.length,
      },
      sections: [
        {
          id: "closure",
          title: APP_COPY.preview.section.closure,
          summary: closureSummary(analysis),
          items: closureItems(analysis, state.seed),
        },
        {
          id: "edges",
          title: APP_COPY.preview.section.edges,
          summary: {
            zh: `${analysis.edges.length} 条线已经有依据。`,
            en: `${analysis.edges.length} rule-backed ${analysis.edges.length === 1 ? "link is" : "links are"} present.`,
          },
          items: edgeItems(analysis, state.seed),
        },
        {
          id: "conflicts",
          title: APP_COPY.preview.section.conflicts,
          summary: APP_COPY.preview.conflictSummary(blocking, warnings),
          items: conflictItems(analysis, state.seed),
        },
        {
          id: "gaps",
          title: APP_COPY.preview.section.gaps,
          summary: APP_COPY.preview.gapSummary(required, recommended),
          items: gapItems(analysis, state.seed),
        },
      ],
    },
  };
}

function relationForRule(relations: readonly MatchedRelation[], ruleId: string): MatchedRelation | undefined {
  return relations.find((relation) => relation.ruleId === ruleId);
}

/** Adapts the stable domain graph without re-deriving any rule in the app layer. */
export function fateGraphToPreviewAnalysis(graph: FateGraph): FateAnalysis {
  const pathId = "core-fate-path";
  const active = graph.closure.status !== "inactive";
  const closed = graph.closure.isClosed;
  const fallbackSummary: LocalizedText = closed
    ? { zh: "主线已经走通。", en: "The main path runs through." }
    : graph.closure.status === "blocked"
      ? { zh: "冲突或缺口把主线截断了。", en: "A conflict or required gap blocks the main path." }
      : active
        ? { zh: "主线已经起头，还没有走到底。", en: "The main path has started but does not reach the end." }
        : APP_COPY.preview.noActivePath;

  const derivedPaths = graph.paths?.map((path) => {
    const firstReason = path.reasons[0];
    return {
      id: path.id,
      status: path.status,
      edgeIds: path.edgeIds,
      summary: firstReason === undefined
        ? path.label
        : {
            zh: `${path.label.zh}：${firstReason.zh}`,
            en: `${path.label.en}: ${firstReason.en}`,
          },
    };
  });
  const paths = derivedPaths ?? (active
    ? [
        {
          id: pathId,
          status: closed ? "closed" as const : graph.closure.status === "blocked" ? "blocked" as const : "open" as const,
          edgeIds: graph.edges.map((edge) => edge.id),
          summary: graph.closure.reasons[0] ?? fallbackSummary,
        },
      ]
    : []);

  const relationEdges = graph.relations.flatMap((relation) => {
    if (
      relation.kind === "conflict" ||
      relation.sources === undefined ||
      relation.target === undefined
    ) return [];
    return [{
      id: relation.id,
      from: relation.sources.join(" + "),
      to: relation.target,
      kind: relation.kind,
      rationale: relation.rationale,
    }];
  });

  return {
    edges: relationEdges.length > 0 ? relationEdges : graph.edges.map((edge) => ({
      id: edge.id,
      from: edge.source,
      to: edge.target,
      kind: edge.kind,
      rationale: relationForRule(graph.relations, edge.ruleId)?.rationale ?? edge.label,
    })),
    conflicts: graph.conflicts.map((conflict) => ({
      id: conflict.id,
      severity: "blocking",
      optionIds: conflict.optionIds,
      message: conflict.rationale,
      repair: conflict.label,
    })),
    gaps: graph.gaps.map((gap) => ({
      id: gap.id,
      priority: gap.blocking ? "required" : "recommended",
      targetAxisId: gap.requiredAxis,
      message: gap.message,
    })),
    paths,
    closure: {
      activePathCount: paths.length,
      closedPathIds: paths.filter((path) => path.status === "closed").map((path) => path.id),
      isFullyClosed: closed,
    },
  };
}

/** Preferred UI entry point: always returns an honest offline structure check. */
export function generateStructurePreview(state: AppState, graph: FateGraph): PreviewBuildResult {
  return buildStructurePreview(state, fateGraphToPreviewAnalysis(graph));
}
