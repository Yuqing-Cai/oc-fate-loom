export type { AxisId, Locale, LocalizedText, OptionId } from "../domain/types";
import type { AxisId, Locale, LocalizedText, OptionId } from "../domain/types";

export type CausalRelationKind = "causal" | "support" | "tension" | "open";

export interface CausalEdge {
  readonly id: string;
  readonly from: OptionId;
  readonly to: OptionId;
  readonly kind: CausalRelationKind;
  /** The option-level reason this relationship exists. */
  readonly rationale: LocalizedText;
}

export type ConflictSeverity = "warning" | "blocking";

export interface FateConflict {
  readonly id: string;
  readonly severity: ConflictSeverity;
  readonly optionIds: readonly OptionId[];
  readonly message: LocalizedText;
  readonly repair?: LocalizedText;
}

export type GapPriority = "required" | "recommended";

export interface FateGap {
  readonly id: string;
  readonly priority: GapPriority;
  readonly targetAxisId?: AxisId;
  readonly message: LocalizedText;
  readonly suggestion?: LocalizedText;
}

export type FatePathStatus = "open" | "closed" | "blocked";

export interface FatePath {
  readonly id: string;
  readonly status: FatePathStatus;
  readonly edgeIds: readonly string[];
  readonly summary: LocalizedText;
}

export interface FateClosure {
  readonly activePathCount: number;
  readonly closedPathIds: readonly string[];
  /** True only when every active path is closed and none is blocked. */
  readonly isFullyClosed: boolean;
}

/**
 * App-facing contract for the option-level domain analysis. Keeping this small
 * makes the UI consume conclusions instead of re-implementing domain rules.
 */
export interface FateAnalysis {
  readonly edges: readonly CausalEdge[];
  readonly conflicts: readonly FateConflict[];
  readonly gaps: readonly FateGap[];
  readonly paths: readonly FatePath[];
  readonly closure: FateClosure;
}

export function localize(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
