import { AXES, getAxis, getOption, isValidSelection } from "./content";
import { FATE_RULES, PATH_REQUIREMENTS } from "./rules";
import type {
  AxisId,
  FateClosure,
  FateConflict,
  FateEdge,
  FateGap,
  FateGraph,
  FateJunction,
  FateNode,
  FatePath,
  LocalizedText,
  MatchedRelation,
  OptionId,
  PathRequirement,
  SelectionMap,
} from "./types";

const text = (zh: string, en: string): LocalizedText => ({ zh, en });

const OPTION_ORDER = new Map<OptionId, number>(
  AXES.flatMap((axis) => axis.options).map((option, index) => [option.id, index]),
);

const compareOptionIds = (left: OptionId, right: OptionId): number =>
  (OPTION_ORDER.get(left) ?? Number.MAX_SAFE_INTEGER) -
    (OPTION_ORDER.get(right) ?? Number.MAX_SAFE_INTEGER) ||
  left.localeCompare(right);

export const normalizeSelections = (
  input: Readonly<Partial<Record<AxisId, string | null | undefined>>>,
): SelectionMap => {
  const normalized: SelectionMap = {};

  for (const axis of AXES) {
    const selected = input[axis.id];
    if (selected !== null && selected !== undefined && isValidSelection(axis.id, selected)) {
      normalized[axis.id] = selected;
    }
  }

  return normalized;
};

const selectedIds = (selections: Readonly<SelectionMap>): readonly OptionId[] =>
  AXES.flatMap((axis) => {
    const selected = selections[axis.id];
    return selected === undefined ? [] : [selected];
  });

interface ActiveRequirement {
  readonly requirement: PathRequirement;
  readonly activatedBy: readonly OptionId[];
}

const requirementActivation = (
  requirement: PathRequirement,
  selected: ReadonlySet<OptionId>,
): readonly OptionId[] | null => {
  const anyMatches = requirement.whenAny?.filter((optionId) => selected.has(optionId)) ?? [];
  const allMatches = requirement.whenAll?.filter((optionId) => selected.has(optionId)) ?? [];
  const anySatisfied = requirement.whenAny === undefined || anyMatches.length > 0;
  const allSatisfied = requirement.whenAll === undefined || allMatches.length === requirement.whenAll.length;

  if (!anySatisfied || !allSatisfied) {
    return null;
  }

  return [...new Set([...anyMatches, ...allMatches])].sort(compareOptionIds);
};

const activeRequirements = (
  selected: ReadonlySet<OptionId>,
): readonly ActiveRequirement[] =>
  PATH_REQUIREMENTS.flatMap((requirement) => {
    const activatedBy = requirementActivation(requirement, selected);
    return activatedBy === null ? [] : [{ requirement, activatedBy }];
  });

const deriveNodes = (selections: Readonly<SelectionMap>): readonly FateNode[] =>
  AXES.flatMap((axis) => {
    const optionId = selections[axis.id];
    if (optionId === undefined) {
      return [];
    }

    const option = getOption(optionId);
    if (option === undefined) {
      return [];
    }

    return [{
      id: option.id,
      optionId: option.id,
      axisId: axis.id,
      chapter: axis.chapter,
      role: axis.role,
      label: option.label,
      axisLabel: axis.label,
      riskTags: option.riskTags,
    }];
  });

const deriveRelations = (selected: ReadonlySet<OptionId>): readonly MatchedRelation[] =>
  FATE_RULES.flatMap((rule) => {
    if (!rule.whenAll.every((optionId) => selected.has(optionId))) {
      return [];
    }

    const relationId = `relation:${rule.id}`;
    return [{
      id: relationId,
      ruleId: rule.id,
      kind: rule.kind,
      optionIds: [...rule.whenAll].sort(compareOptionIds),
      sources: [...rule.sources].sort(compareOptionIds),
      target: rule.target,
      prerequisiteMode: "all" as const,
      junctionId: rule.kind !== "conflict" && rule.sources.length > 1
        ? `junction:${rule.id}`
        : null,
      label: rule.label,
      rationale: rule.rationale,
    }];
  });

const deriveEdges = (
  relations: readonly MatchedRelation[],
): readonly FateEdge[] => {
  const ruleById = new Map(FATE_RULES.map((rule) => [rule.id, rule]));
  const edges: FateEdge[] = [];

  for (const relation of relations) {
    if (relation.kind === "conflict") {
      continue;
    }

    const matchedRule = ruleById.get(relation.ruleId);
    if (matchedRule === undefined) {
      continue;
    }

    for (const source of matchedRule.sources) {
      edges.push({
        id: `edge:${matchedRule.id}:${source}->${matchedRule.target}`,
        ruleId: matchedRule.id,
        relationId: relation.id,
        source,
        target: matchedRule.target,
        kind: relation.kind,
        label: matchedRule.label,
        prerequisiteMode: "all",
        sourceCount: matchedRule.sources.length,
      });
    }
  }

  return edges.sort((left, right) =>
    compareOptionIds(left.source, right.source) ||
      compareOptionIds(left.target, right.target) ||
      left.ruleId.localeCompare(right.ruleId),
  );
};

const deriveJunctions = (
  relations: readonly MatchedRelation[],
): readonly FateJunction[] =>
  relations.flatMap((relation) => {
    if (
      relation.kind === "conflict" ||
      relation.junctionId === null ||
      relation.junctionId === undefined ||
      relation.sources === undefined ||
      relation.target === undefined
    ) {
      return [];
    }

    return [{
      id: relation.junctionId,
      relationId: relation.id,
      ruleId: relation.ruleId,
      prerequisiteMode: "all" as const,
      sources: relation.sources,
      target: relation.target,
      kind: relation.kind,
      label: relation.label,
    }];
  });

const deriveConflicts = (
  relations: readonly MatchedRelation[],
): readonly FateConflict[] =>
  relations.flatMap((relation) => relation.kind === "conflict" ? [{
    id: `conflict:${relation.ruleId}`,
    ruleId: relation.ruleId,
    optionIds: relation.optionIds,
    label: relation.label,
    rationale: relation.rationale,
  }] : []);

const deriveGaps = (
  selections: Readonly<SelectionMap>,
  activations: readonly ActiveRequirement[],
): readonly FateGap[] =>
  activations.flatMap(({ requirement, activatedBy }) => {
    const selectedOption = selections[requirement.requiredAxis] ?? null;
    const acceptable = requirement.acceptableOptions ?? null;
    const isSatisfied = selectedOption !== null &&
      (acceptable === null || acceptable.includes(selectedOption));

    if (isSatisfied) {
      return [];
    }

    return [{
      id: `gap:${requirement.id}`,
      pathId: requirement.pathId,
      activatedBy,
      requiredAxis: requirement.requiredAxis,
      acceptableOptions: acceptable,
      selectedOption,
      blocking: requirement.blocking,
      message: requirement.message,
    }];
  }).sort((left, right) => {
    const leftAxis = getAxis(left.requiredAxis)?.order ?? Number.MAX_SAFE_INTEGER;
    const rightAxis = getAxis(right.requiredAxis)?.order ?? Number.MAX_SAFE_INTEGER;
    return leftAxis - rightAxis || left.id.localeCompare(right.id);
  });

const PATH_LABELS: Readonly<Record<string, LocalizedText>> = {
  "story-weave": text("故事主线", "Story line"),
  "lifespan-gap": text("寿命差", "Lifespan gap"),
  "borrowed-time": text("借来的时间", "Borrowed time"),
  "possession-boundary": text("占有与边界", "Possession and boundaries"),
};

const pathLabel = (pathId: string): LocalizedText =>
  PATH_LABELS[pathId] ?? text(pathId, pathId);

interface CoreConnectivity {
  readonly qualifies: boolean;
  readonly nodeIds: readonly OptionId[];
  readonly relationIds: readonly string[];
  readonly edgeIds: readonly string[];
  readonly terminalOptionId: OptionId | null;
  readonly reasons: readonly LocalizedText[];
}

const deriveCoreConnectivity = (
  selections: Readonly<SelectionMap>,
  relations: readonly MatchedRelation[],
  edges: readonly FateEdge[],
): CoreConnectivity => {
  const terminalOptionId = selections["fate.ending"] ?? null;
  if (terminalOptionId === null) {
    return {
      qualifies: false,
      nodeIds: [],
      relationIds: [],
      edgeIds: [],
      terminalOptionId: null,
      reasons: [text("终局还空着，这条主线暂时没有落点。", "The ending is still blank, so this story line has nowhere to land yet.")],
    };
  }

  const eligible = relations.filter((relation) =>
    (relation.kind === "causal" || relation.kind === "support") &&
    relation.sources !== undefined &&
    relation.target !== undefined,
  );
  const reached = new Set<OptionId>([terminalOptionId]);
  const included = new Set<string>();
  let changed = true;

  while (changed) {
    changed = false;
    for (const relation of eligible) {
      if (relation.target === undefined || !reached.has(relation.target) || included.has(relation.id)) {
        continue;
      }
      included.add(relation.id);
      for (const source of relation.sources ?? []) {
        if (!reached.has(source)) {
          reached.add(source);
          changed = true;
        }
      }
    }
  }

  const includedRelations = relations.filter((relation) => included.has(relation.id));
  const includedEdges = edges.filter((edge) =>
    edge.relationId !== undefined && included.has(edge.relationId),
  );
  const reachedOptions = [...reached].sort(compareOptionIds);
  const reachedAxes = reachedOptions.flatMap((optionId) => {
    const optionValue = getOption(optionId);
    const axisValue = optionValue === undefined ? undefined : getAxis(optionValue.axisId);
    return axisValue === undefined ? [] : [axisValue];
  });
  const hasContext = reachedAxes.some((axis) => axis.chapter === "context");
  const hasRoleA = reachedAxes.some((axis) => axis.role === "roleA");
  const hasRoleB = reachedAxes.some((axis) => axis.role === "roleB");
  const hasRelationship = reachedAxes.some((axis) => axis.chapter === "relationship");
  const hasCost = reachedAxes.some((axis) => axis.id === "fate.cost");
  const hasEligibleRelation = includedRelations.length > 0;
  const reasons: LocalizedText[] = [];

  if (!hasEligibleRelation) {
    reasons.push(text(
      "还没有因果或支持线接到终局。选项填满了，也不等于路已经走通。",
      "No causal or supporting line reaches the ending yet. Filling every field does not, by itself, complete the route.",
    ));
  }
  if (!hasContext) reasons.push(text("境遇还没接进主线。", "The situation is not connected to the story line yet."));
  if (!hasRoleA) reasons.push(text("她的选择还没接进主线。", "Her choice is not connected to the story line yet."));
  if (!hasRoleB) reasons.push(text("他的选择还没接进主线。", "His choice is not connected to the story line yet."));
  if (!hasRelationship) reasons.push(text("两人的相处方式还没接进主线。", "The way they relate is not connected to the story line yet."));
  if (!hasCost) reasons.push(text("代价还没接到终局。", "The cost is not connected to the ending yet."));

  return {
    qualifies: hasEligibleRelation && hasContext && hasRoleA && hasRoleB && hasRelationship && hasCost,
    nodeIds: reachedOptions,
    relationIds: includedRelations.map((relation) => relation.id),
    edgeIds: includedEdges.map((edge) => edge.id),
    terminalOptionId,
    reasons,
  };
};

const deriveCorePath = (
  selections: Readonly<SelectionMap>,
  relations: readonly MatchedRelation[],
  edges: readonly FateEdge[],
  gaps: readonly FateGap[],
  conflicts: readonly FateConflict[],
): FatePath => {
  const connectivity = deriveCoreConnectivity(selections, relations, edges);
  const pathGaps = gaps.filter((gap) => gap.pathId === "story-weave" && gap.blocking);
  const status = conflicts.length > 0
    ? "blocked"
    : pathGaps.length > 0 || !connectivity.qualifies
      ? "open"
      : "closed";
  const reasons: LocalizedText[] = [];

  if (conflicts.length > 0) {
    reasons.push(text(
      `${conflicts.length} 处冲突把主线截断了。`,
      `${conflicts.length} conflict${conflicts.length === 1 ? " cuts" : "s cut"} off the story line.`,
    ));
  }
  if (pathGaps.length > 0) {
    reasons.push(text(
      `主线还有 ${pathGaps.length} 个绕不过去的缺口。`,
      `The story line still has ${pathGaps.length} gap${pathGaps.length === 1 ? "" : "s"} that cannot be skipped.`,
    ));
  }
  reasons.push(...connectivity.reasons);
  if (status === "closed") {
    reasons.push(text(
      "境遇、两个人、关系与代价都已经沿因果或支持线接到终局。",
      "Situation, both characters, relationship, and cost now connect to the ending through causal or supporting lines.",
    ));
  }

  return {
    id: "story-weave",
    kind: "core",
    status,
    label: pathLabel("story-weave"),
    nodeIds: connectivity.nodeIds,
    relationIds: connectivity.relationIds,
    edgeIds: connectivity.edgeIds,
    gapIds: pathGaps.map((gap) => gap.id),
    conflictIds: conflicts.map((conflict) => conflict.id),
    terminalOptionId: connectivity.terminalOptionId,
    reasons,
  };
};

const deriveSpecializedPath = (
  pathId: string,
  activations: readonly ActiveRequirement[],
  selections: Readonly<SelectionMap>,
  relations: readonly MatchedRelation[],
  edges: readonly FateEdge[],
  gaps: readonly FateGap[],
  conflicts: readonly FateConflict[],
): FatePath => {
  const relevantActivations = activations.filter(({ requirement }) => requirement.pathId === pathId);
  const nodeSet = new Set<OptionId>();
  for (const { requirement, activatedBy } of relevantActivations) {
    activatedBy.forEach((optionId) => nodeSet.add(optionId));
    const requiredSelection = selections[requirement.requiredAxis];
    if (requiredSelection !== undefined) nodeSet.add(requiredSelection);
  }
  const pathRelations = relations.filter((relation) =>
    relation.optionIds.length > 0 && relation.optionIds.every((optionId) => nodeSet.has(optionId)),
  );
  const carryingRelations = pathRelations.filter((relation) =>
    relation.kind === "causal" || relation.kind === "support",
  );
  const relationIds = new Set(pathRelations.map((relation) => relation.id));
  const pathEdges = edges.filter((edge) =>
    edge.relationId !== undefined && relationIds.has(edge.relationId),
  );
  const pathGaps = gaps.filter((gap) => gap.pathId === pathId && gap.blocking);
  const pathConflicts = conflicts.filter((conflict) =>
    conflict.optionIds.length > 0 && conflict.optionIds.every((optionId) => nodeSet.has(optionId)),
  );
  const hasCarryingRelation = carryingRelations.length > 0;
  const status = pathConflicts.length > 0
    ? "blocked"
    : pathGaps.length > 0 || !hasCarryingRelation
      ? "open"
      : "closed";
  const reasons: LocalizedText[] = status === "closed"
    ? [text("这条附加线已经接上。", "This side line is connected.")]
    : status === "blocked"
      ? [text(
          `${pathConflicts.length} 处冲突把这条线截断了。`,
          `${pathConflicts.length} conflict${pathConflicts.length === 1 ? " cuts" : "s cut"} off this side line.`,
        )]
      : pathGaps.length > 0
        ? [text(
            `这条线还有 ${pathGaps.length} 个绕不过去的缺口。`,
            `This side line still has ${pathGaps.length} gap${pathGaps.length === 1 ? "" : "s"} that cannot be skipped.`,
          )]
        : [text(
            "选项已经填了，却只有张力或开放关系；还没有因果或支持线把它接起来。",
            "The choices are filled, but they only create tension or an open relation; no causal or supporting line connects them yet.",
          )];

  return {
    id: pathId,
    kind: "specialized",
    status,
    label: pathLabel(pathId),
    nodeIds: [...nodeSet].sort(compareOptionIds),
    relationIds: pathRelations.map((relation) => relation.id),
    edgeIds: pathEdges.map((edge) => edge.id),
    gapIds: pathGaps.map((gap) => gap.id),
    conflictIds: pathConflicts.map((conflict) => conflict.id),
    terminalOptionId: null,
    reasons,
  };
};

const derivePaths = (
  narrativeSelectionCount: number,
  selections: Readonly<SelectionMap>,
  activations: readonly ActiveRequirement[],
  relations: readonly MatchedRelation[],
  edges: readonly FateEdge[],
  gaps: readonly FateGap[],
  conflicts: readonly FateConflict[],
): readonly FatePath[] => {
  if (narrativeSelectionCount === 0) return [];

  const paths: FatePath[] = [deriveCorePath(selections, relations, edges, gaps, conflicts)];
  const specializedIds: string[] = [];
  for (const { requirement } of activations) {
    if (requirement.pathId !== "story-weave" && !specializedIds.includes(requirement.pathId)) {
      specializedIds.push(requirement.pathId);
    }
  }
  for (const pathId of specializedIds) {
    paths.push(deriveSpecializedPath(
      pathId,
      activations,
      selections,
      relations,
      edges,
      gaps,
      conflicts,
    ));
  }
  return paths;
};

const deriveClosure = (paths: readonly FatePath[]): FateClosure => {
  if (paths.length === 0) {
    return {
      status: "inactive",
      isClosed: false,
      reasons: [text("还没选剧情内容，命运图暂时不起线。", "No story choices yet, so the fate map has no lines to draw.")],
      activePathCount: 0,
      closedPathCount: 0,
      openPathCount: 0,
      blockedPathCount: 0,
      closedPathIds: [],
    };
  }

  const closed = paths.filter((path) => path.status === "closed");
  const open = paths.filter((path) => path.status === "open");
  const blocked = paths.filter((path) => path.status === "blocked");
  const core = paths.find((path) => path.kind === "core");
  const counts = {
    activePathCount: paths.length,
    closedPathCount: closed.length,
    openPathCount: open.length,
    blockedPathCount: blocked.length,
    closedPathIds: closed.map((path) => path.id),
  } as const;

  if (blocked.length > 0) {
    return {
      status: "blocked",
      isClosed: false,
      reasons: [text(
        `${blocked.length} 条路被冲突截断。`,
        `${blocked.length} path${blocked.length === 1 ? " is" : "s are"} cut off by conflict.`,
      )],
      ...counts,
    };
  }

  if (core?.status !== "closed" || open.length > 0) {
    return {
      status: "open",
      isClosed: false,
      reasons: [text(
        `${closed.length}/${paths.length} 条路已经走通；主线和所有已经起头的附加线都走到底，才算闭合。`,
        `${closed.length} of ${paths.length} paths are complete; the story line and every side line already in play must reach the end.`,
      )],
      ...counts,
    };
  }

  return {
    status: "closed",
    isClosed: true,
    reasons: [text(
      paths.length === 1
        ? "这条路已经走通，主线也接到了终局。"
        : `${paths.length} 条路都已经走通，主线也接到了终局。`,
      paths.length === 1
        ? "The path is complete, and the story line reaches the ending."
        : `All ${paths.length} paths are complete, and the story line reaches the ending.`,
    )],
    ...counts,
  };
};

export const deriveFateGraph = (
  input: Readonly<Partial<Record<AxisId, string | null | undefined>>>,
): FateGraph => {
  const selections = normalizeSelections(input);
  const optionIds = selectedIds(selections);
  const selected = new Set(optionIds);
  const nodes = deriveNodes(selections);
  const relations = deriveRelations(selected);
  const edges = deriveEdges(relations);
  const junctions = deriveJunctions(relations);
  const conflicts = deriveConflicts(relations);
  const activations = activeRequirements(selected);
  const gaps = deriveGaps(selections, activations);
  const narrativeSelectionCount = nodes.filter((node) => node.chapter !== "palette").length;
  const paths = derivePaths(
    narrativeSelectionCount,
    selections,
    activations,
    relations,
    edges,
    gaps,
    conflicts,
  );
  const closure = deriveClosure(paths);

  return {
    selections,
    nodes,
    edges,
    relations,
    junctions,
    paths,
    gaps,
    conflicts,
    closure,
  };
};
