export type GenerationLocale = "zh" | "en";
export type GenerationMode = "opening" | "timeline";

export interface AxisSelectionInput {
  readonly axisId: string;
  readonly optionId: string;
}

/**
 * The only browser-authored body accepted by the owner-funded relay.
 *
 * Provider identity, model identity, system instructions, credentials, and
 * upstream endpoint details are deliberately absent. Those decisions belong
 * to the relay deployment, not to untrusted browser input.
 */
export interface StructuredGenerationPayload {
  readonly schemaVersion: 1;
  readonly locale: GenerationLocale;
  readonly mode: GenerationMode;
  readonly selections: readonly AxisSelectionInput[];
  readonly additionalDirection?: string;
}

export interface ValidatedGenerationPayload {
  readonly schemaVersion: 1;
  readonly locale: GenerationLocale;
  readonly mode: GenerationMode;
  readonly selections: readonly Readonly<AxisSelectionInput>[];
  readonly additionalDirection?: string;
}

export interface FetchLike {
  (
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response>;
}

const PAYLOAD_KEYS = new Set([
  "schemaVersion",
  "locale",
  "mode",
  "selections",
  "additionalDirection",
]);
const SELECTION_KEYS = new Set(["axisId", "optionId"]);
const SAFE_IDENTIFIER = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertExactStringKeys(
  value: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  label: string,
): void {
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowed.has(key)) {
      throw new TypeError(`${label} contains an unsupported field.`);
    }
  }
}

function validateIdentifier(value: unknown, label: string): string {
  if (typeof value !== "string" || !SAFE_IDENTIFIER.test(value)) {
    throw new TypeError(`${label} must be a short stable identifier.`);
  }
  return value;
}

/**
 * Runtime validation is required even though TypeScript exposes a narrow
 * interface: callers can still arrive from plain JavaScript or cast values.
 */
export function validateStructuredGenerationPayload(
  candidate: unknown,
): ValidatedGenerationPayload {
  if (!isRecord(candidate)) {
    throw new TypeError("Generation payload must be a structured object.");
  }
  assertExactStringKeys(candidate, PAYLOAD_KEYS, "Generation payload");

  if (candidate.schemaVersion !== 1) {
    throw new TypeError("Generation payload schemaVersion must be 1.");
  }
  if (candidate.locale !== "zh" && candidate.locale !== "en") {
    throw new TypeError("Generation payload locale is unsupported.");
  }
  if (candidate.mode !== "opening" && candidate.mode !== "timeline") {
    throw new TypeError("Generation payload mode is unsupported.");
  }
  if (!Array.isArray(candidate.selections) || candidate.selections.length > 32) {
    throw new TypeError("Generation payload selections are invalid.");
  }

  const seenAxes = new Set<string>();
  const selections = candidate.selections.map((selection, index) => {
    if (!isRecord(selection)) {
      throw new TypeError(`Selection ${index} must be a structured object.`);
    }
    assertExactStringKeys(selection, SELECTION_KEYS, `Selection ${index}`);
    const axisId = validateIdentifier(selection.axisId, `Selection ${index} axisId`);
    const optionId = validateIdentifier(
      selection.optionId,
      `Selection ${index} optionId`,
    );
    if (seenAxes.has(axisId)) {
      throw new TypeError("Generation payload contains a duplicate axis.");
    }
    seenAxes.add(axisId);
    return Object.freeze({ axisId, optionId });
  });

  let additionalDirection: string | undefined;
  if (candidate.additionalDirection !== undefined) {
    if (
      typeof candidate.additionalDirection !== "string" ||
      candidate.additionalDirection.length > 2_000 ||
      CONTROL_CHARACTERS.test(candidate.additionalDirection)
    ) {
      throw new TypeError("Generation payload additionalDirection is invalid.");
    }
    additionalDirection = candidate.additionalDirection;
  }

  return Object.freeze({
    schemaVersion: 1,
    locale: candidate.locale,
    mode: candidate.mode,
    selections: Object.freeze(selections),
    ...(additionalDirection === undefined ? {} : { additionalDirection }),
  });
}

