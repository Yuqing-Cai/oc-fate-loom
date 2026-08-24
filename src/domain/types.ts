export type Locale = "zh" | "en";

export interface LocalizedText {
  readonly zh: string;
  readonly en: string;
}

export type ChapterId =
  | "context"
  | "characters"
  | "relationship"
  | "fate"
  | "palette";

export type RoleId = "roleA" | "roleB";

export type AxisId =
  | "context.pressure"
  | "context.clock"
  | "roleA.goal"
  | "roleA.stance"
  | "roleA.boundary"
  | "roleA.vulnerability"
  | "roleA.choice"
  | "roleB.goal"
  | "roleB.stance"
  | "roleB.boundary"
  | "roleB.vulnerability"
  | "roleB.choice"
  | "relationship.power"
  | "relationship.bond"
  | "fate.cost"
  | "fate.ending"
  | "prose.palette";

export type OptionId = string;

export type CharacterDimension =
  | "goal"
  | "stance"
  | "boundary"
  | "vulnerability"
  | "choice";

export type RiskTag =
  | "body-autonomy"
  | "coercion"
  | "control"
  | "death"
  | "dependency"
  | "identity-loss"
  | "power-imbalance"
  | "separation"
  | "violence";

export interface RolePresentation {
  readonly id: RoleId;
  readonly name: LocalizedText;
  readonly subject: LocalizedText;
  readonly possessive: LocalizedText;
}

export interface Chapter {
  readonly id: ChapterId;
  readonly order: number;
  readonly label: LocalizedText;
  readonly eyebrow: LocalizedText;
  readonly description: LocalizedText;
}

export interface AxisOption {
  readonly id: OptionId;
  readonly axisId: AxisId;
  readonly semanticKey: string;
  readonly label: LocalizedText;
  readonly summary: LocalizedText;
  readonly detail: LocalizedText;
  readonly tags: readonly string[];
  readonly riskTags: readonly RiskTag[];
}

export interface Axis {
  readonly id: AxisId;
  readonly chapter: ChapterId;
  readonly order: number;
  readonly role: RoleId | null;
  readonly dimension: CharacterDimension | null;
  readonly selectionMode: "single";
  readonly label: LocalizedText;
  readonly shortLabel: LocalizedText;
  readonly question: LocalizedText;
  readonly description: LocalizedText;
  readonly options: readonly AxisOption[];
}

export type SelectionMap = Partial<Record<AxisId, OptionId>>;

export type RelationKind =
  | "support"
  | "tension"
  | "conflict"
  | "causal"
  | "open";

export type EdgeKind = Exclude<RelationKind, "conflict">;

export interface FateRule {
  readonly id: string;
  readonly kind: RelationKind;
  /** Every option in this list must be selected for the rule to match. */
  readonly whenAll: readonly OptionId[];
  /** Sources and target are ordered so compatible rules always form a DAG. */
  readonly sources: readonly OptionId[];
  readonly target: OptionId;
  readonly label: LocalizedText;
  readonly rationale: LocalizedText;
}

export interface PathRequirement {
  readonly id: string;
  readonly pathId: string;
  readonly whenAny?: readonly OptionId[];
  readonly whenAll?: readonly OptionId[];
  readonly requiredAxis: AxisId;
  readonly acceptableOptions?: readonly OptionId[];
  readonly blocking: boolean;
  readonly message: LocalizedText;
}

export interface FateNode {
  readonly id: OptionId;
  readonly optionId: OptionId;
  readonly axisId: AxisId;
  readonly chapter: ChapterId;
  readonly role: RoleId | null;
  readonly label: LocalizedText;
  readonly axisLabel: LocalizedText;
  readonly riskTags: readonly RiskTag[];
}

export interface MatchedRelation {
  readonly id: string;
  readonly ruleId: string;
  readonly kind: RelationKind;
  readonly optionIds: readonly OptionId[];
  /** Exact prerequisites. Every source is required; none is sufficient alone. */
  readonly sources?: readonly OptionId[];
  readonly target?: OptionId;
  readonly prerequisiteMode?: "all";
  /** Present when a renderer must join two or more prerequisites before the target. */
  readonly junctionId?: string | null;
  readonly label: LocalizedText;
  readonly rationale: LocalizedText;
}

export interface FateEdge {
  readonly id: string;
  readonly ruleId: string;
  readonly source: OptionId;
  readonly target: OptionId;
  readonly kind: EdgeKind;
  readonly label: LocalizedText;
  /** Groups compatibility arcs back into their indivisible option-level rule. */
  readonly relationId?: string;
  readonly prerequisiteMode?: "all";
  readonly sourceCount?: number;
}

export interface FateJunction {
  readonly id: string;
  readonly relationId: string;
  readonly ruleId: string;
  readonly prerequisiteMode: "all";
  readonly sources: readonly OptionId[];
  readonly target: OptionId;
  readonly kind: EdgeKind;
  readonly label: LocalizedText;
}

export interface FateGap {
  readonly id: string;
  readonly pathId: string;
  readonly activatedBy: readonly OptionId[];
  readonly requiredAxis: AxisId;
  readonly acceptableOptions: readonly OptionId[] | null;
  readonly selectedOption: OptionId | null;
  readonly blocking: boolean;
  readonly message: LocalizedText;
}

export interface FateConflict {
  readonly id: string;
  readonly ruleId: string;
  readonly optionIds: readonly OptionId[];
  readonly label: LocalizedText;
  readonly rationale: LocalizedText;
}

export type ClosureStatus = "inactive" | "open" | "blocked" | "closed";

export type FatePathStatus = "open" | "blocked" | "closed";
export type FatePathKind = "core" | "specialized";

export interface FatePath {
  readonly id: string;
  readonly kind: FatePathKind;
  readonly status: FatePathStatus;
  readonly label: LocalizedText;
  readonly nodeIds: readonly OptionId[];
  readonly relationIds: readonly string[];
  readonly edgeIds: readonly string[];
  readonly gapIds: readonly string[];
  readonly conflictIds: readonly string[];
  readonly terminalOptionId: OptionId | null;
  readonly reasons: readonly LocalizedText[];
}

export interface FateClosure {
  readonly status: ClosureStatus;
  readonly isClosed: boolean;
  readonly reasons: readonly LocalizedText[];
  /** Populated by deriveFateGraph; optional only for legacy serialized fixtures. */
  readonly activePathCount?: number;
  readonly closedPathCount?: number;
  readonly openPathCount?: number;
  readonly blockedPathCount?: number;
  readonly closedPathIds?: readonly string[];
}

export interface FateGraph {
  readonly selections: Readonly<SelectionMap>;
  readonly nodes: readonly FateNode[];
  readonly edges: readonly FateEdge[];
  readonly relations: readonly MatchedRelation[];
  /** Populated by deriveFateGraph; optional only for legacy serialized fixtures. */
  readonly junctions?: readonly FateJunction[];
  readonly paths?: readonly FatePath[];
  readonly gaps: readonly FateGap[];
  readonly conflicts: readonly FateConflict[];
  readonly closure: FateClosure;
}
