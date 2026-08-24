import { AXES } from "../domain/content";
import type { AxisId, Locale, OptionId } from "./contracts";
import { normalizeSeed } from "./random";

export const APP_STATE_VERSION = 1 as const;
export const DEFAULT_APP_SEED = "fate-loom";
export const APP_AXIS_IDS: readonly AxisId[] = AXES.map((axis) => axis.id);

const APP_AXIS_ID_SET: ReadonlySet<string> = new Set(APP_AXIS_IDS);

export function isAxisId(value: string): value is AxisId {
  return APP_AXIS_ID_SET.has(value);
}

export type GenerationRoute = "offline" | "default" | "byok";
export type OutputMode = "outline" | "full";

export interface AppState {
  readonly version: typeof APP_STATE_VERSION;
  readonly locale: Locale;
  readonly route: GenerationRoute;
  readonly outputMode: OutputMode;
  readonly seed: string;
  readonly selections: Readonly<Partial<Record<AxisId, OptionId>>>;
  readonly notes: string;
  readonly connection: {
    readonly providerId: string;
    readonly modelId: string;
  };
  readonly draftSavingEnabled: boolean;
}

export interface InitialAppStateOptions {
  readonly locale?: Locale;
  readonly seed?: string;
  readonly draftSavingEnabled?: boolean;
}

export function createInitialAppState(options: InitialAppStateOptions = {}): AppState {
  return {
    version: APP_STATE_VERSION,
    locale: options.locale ?? "zh",
    route: "offline",
    outputMode: "outline",
    seed: normalizeSeed(options.seed ?? DEFAULT_APP_SEED),
    selections: {},
    notes: "",
    connection: { providerId: "", modelId: "" },
    draftSavingEnabled: options.draftSavingEnabled ?? false,
  };
}

export const createInitialState = createInitialAppState;

export type AppAction =
  | { readonly type: "select"; readonly axisId: AxisId; readonly optionId: OptionId }
  | { readonly type: "clear-axis"; readonly axisId: AxisId }
  | { readonly type: "set-locale"; readonly locale: Locale }
  | { readonly type: "set-route"; readonly route: GenerationRoute }
  | { readonly type: "set-output-mode"; readonly outputMode: OutputMode }
  | { readonly type: "set-seed"; readonly seed: string }
  | { readonly type: "set-notes"; readonly notes: string }
  | { readonly type: "set-provider"; readonly providerId: string }
  | { readonly type: "set-model"; readonly modelId: string }
  | { readonly type: "set-draft-saving"; readonly enabled: boolean }
  | { readonly type: "clear-all" };

export function reduceAppState(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "select":
      return { ...state, selections: { ...state.selections, [action.axisId]: action.optionId } };
    case "clear-axis": {
      const selections = { ...state.selections };
      delete selections[action.axisId];
      return { ...state, selections };
    }
    case "set-locale":
      return { ...state, locale: action.locale };
    case "set-route":
      return { ...state, route: action.route };
    case "set-output-mode":
      return { ...state, outputMode: action.outputMode };
    case "set-seed":
      return { ...state, seed: normalizeSeed(action.seed) };
    case "set-notes":
      return { ...state, notes: action.notes };
    case "set-provider":
      return { ...state, connection: { ...state.connection, providerId: action.providerId.trim() } };
    case "set-model":
      return { ...state, connection: { ...state.connection, modelId: action.modelId.trim() } };
    case "set-draft-saving":
      return { ...state, draftSavingEnabled: action.enabled };
    case "clear-all":
      return createInitialAppState({
        locale: state.locale,
        draftSavingEnabled: state.draftSavingEnabled,
      });
  }
}

export function selectedOptionIds(state: AppState): readonly OptionId[] {
  return Object.entries(state.selections)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, optionId]) => optionId);
}

export function updateSelection(state: AppState, axisId: AxisId, optionId: OptionId | null): AppState {
  return optionId === null
    ? reduceAppState(state, { type: "clear-axis", axisId })
    : reduceAppState(state, { type: "select", axisId, optionId });
}
