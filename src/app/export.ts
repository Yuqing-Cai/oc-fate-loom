import type { AppState } from "./state";

export const EXPORT_SCHEMA = "oc-fate-loom/config@1" as const;

export interface ExportedConfiguration {
  readonly schema: typeof EXPORT_SCHEMA;
  readonly locale: AppState["locale"];
  readonly route: AppState["route"];
  readonly outputMode: AppState["outputMode"];
  readonly seed: string;
  readonly selections: Readonly<Record<string, string>>;
  readonly notes: string;
  readonly connection: {
    readonly providerId: string;
    readonly modelId: string;
  };
  readonly privacy: {
    readonly dedicatedApiKeyFieldIncluded: false;
    readonly freeTextNotesIncluded: true;
  };
}

export function createExportedConfiguration(state: AppState): ExportedConfiguration {
  return {
    schema: EXPORT_SCHEMA,
    locale: state.locale,
    route: state.route,
    outputMode: state.outputMode,
    seed: state.seed,
    selections: Object.fromEntries(Object.entries(state.selections).sort(([a], [b]) => a.localeCompare(b))),
    notes: state.notes,
    connection: { ...state.connection },
    privacy: {
      dedicatedApiKeyFieldIncluded: false,
      freeTextNotesIncluded: true,
    },
  };
}

export function serializeConfiguration(state: AppState): string {
  return JSON.stringify(createExportedConfiguration(state), null, 2);
}

export function exportFileName(state: AppState): string {
  const safeSeed = state.seed.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "fate-loom";
  return `oc-fate-loom-${safeSeed}.json`;
}
