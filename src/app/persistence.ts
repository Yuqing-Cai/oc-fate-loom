import type { AxisId, Locale, OptionId } from "./contracts";
import {
  APP_STATE_VERSION,
  createInitialAppState,
  isAxisId,
  type AppState,
  type GenerationRoute,
  type OutputMode,
} from "./state";

export const DRAFT_STORAGE_KEY = "oc-fate-loom:draft:v1";

export interface StorageLike {
  readonly getItem: (key: string) => string | null;
  readonly setItem: (key: string, value: string) => void;
  readonly removeItem: (key: string) => void;
}

interface PersistedDraft {
  readonly version: typeof APP_STATE_VERSION;
  readonly locale: Locale;
  readonly route: GenerationRoute;
  readonly outputMode: OutputMode;
  readonly seed: string;
  readonly selections: Readonly<Record<string, string>>;
  readonly notes: string;
  readonly connection: {
    readonly providerId: string;
    readonly modelId: string;
  };
}

function toPersistedDraft(state: AppState): PersistedDraft {
  return {
    version: APP_STATE_VERSION,
    locale: state.locale,
    route: state.route,
    outputMode: state.outputMode,
    seed: state.seed,
    selections: Object.fromEntries(Object.entries(state.selections).sort(([a], [b]) => a.localeCompare(b))),
    notes: state.notes,
    connection: state.connection,
  };
}

export function encodeDraft(state: AppState): string {
  return JSON.stringify(toPersistedDraft(state));
}

export function persistDraft(storage: StorageLike, state: AppState): void {
  if (!state.draftSavingEnabled) {
    storage.removeItem(DRAFT_STORAGE_KEY);
    return;
  }
  storage.setItem(DRAFT_STORAGE_KEY, encodeDraft(state));
}

export function clearSavedDraft(storage: StorageLike): void {
  storage.removeItem(DRAFT_STORAGE_KEY);
}

export function disableDraftSaving(storage: StorageLike, state: AppState): AppState {
  clearSavedDraft(storage);
  return { ...state, draftSavingEnabled: false };
}

const isStringRecord = (value: unknown): value is Record<string, string> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((entry) => typeof entry === "string");
};

function decodeSelections(value: unknown, fallback: AppState["selections"]): AppState["selections"] {
  if (!isStringRecord(value)) return fallback;
  const selections: Partial<Record<AxisId, OptionId>> = {};
  for (const [axisId, optionId] of Object.entries(value)) {
    if (isAxisId(axisId) && optionId.trim()) selections[axisId] = optionId;
  }
  return selections;
}

export function decodeDraft(raw: string, fallback: AppState = createInitialAppState()): AppState {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (!value || typeof value !== "object" || value.version !== APP_STATE_VERSION) return fallback;
    const connection = value.connection as Record<string, unknown> | undefined;
    const locale = value.locale === "en" || value.locale === "zh" ? value.locale : fallback.locale;
    const route = value.route === "offline" || value.route === "default" || value.route === "byok" ? value.route : fallback.route;
    const outputMode = value.outputMode === "outline" || value.outputMode === "full" ? value.outputMode : fallback.outputMode;
    return {
      ...fallback,
      locale,
      route,
      outputMode,
      seed: typeof value.seed === "string" && value.seed.trim() ? value.seed.trim() : fallback.seed,
      selections: decodeSelections(value.selections, fallback.selections),
      notes: typeof value.notes === "string" ? value.notes : fallback.notes,
      connection: {
        providerId: typeof connection?.providerId === "string" ? connection.providerId : "",
        modelId: typeof connection?.modelId === "string" ? connection.modelId : "",
      },
      draftSavingEnabled: true,
    };
  } catch {
    return fallback;
  }
}

export function loadDraft(storage: StorageLike, fallback: AppState = createInitialAppState()): AppState {
  const raw = storage.getItem(DRAFT_STORAGE_KEY);
  return raw === null ? fallback : decodeDraft(raw, fallback);
}
