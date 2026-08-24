import { resolveDirectByokUrl } from "./endpoint-policy";
import { UNCONFIGURED_EXECUTION_GUARDS } from "./execution-guards";
import {
  validateStructuredGenerationPayload,
  type FetchLike,
  type StructuredGenerationPayload,
  type ValidatedGenerationPayload,
} from "./types";

export interface DirectByokProviderDefinition {
  readonly id: string;
  readonly displayName: string;
  readonly transport: "direct-only";
  readonly endpointUrl: string;
  readonly allowedProviderOrigins: readonly string[];
  /** Must be confirmed before an adapter is admitted to the registry. */
  readonly supportsBrowserCors: true;
}

export interface DirectByokGenerationRequest {
  readonly modelId: string;
  readonly apiKey: string;
  readonly payload: StructuredGenerationPayload;
}

const PROVIDER_ID = /^[a-z][a-z0-9-]{0,63}$/;
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/;

function defaultFetch(): FetchLike {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("Fetch is not available in this environment.");
  }
  return globalThis.fetch.bind(globalThis);
}

/**
 * BYOK is deliberately unrelated to DefaultRelayClient. It sends a visitor's
 * short-lived key straight to one reviewed provider endpoint and has no relay
 * URL, owner-funded fallback, or mutable endpoint parameter.
 */
export abstract class DirectByokAdapter {
  readonly transport = "direct-only" as const;
  readonly guards = UNCONFIGURED_EXECUTION_GUARDS;
  readonly id: string;
  readonly displayName: string;
  readonly supportsBrowserCors = true as const;
  readonly #endpointUrl: URL;
  readonly #fetch: FetchLike;

  protected constructor(
    definition: DirectByokProviderDefinition,
    fetchImpl?: FetchLike,
  ) {
    if (!PROVIDER_ID.test(definition.id)) {
      throw new TypeError("BYOK provider id is invalid.");
    }
    if (!definition.displayName.trim()) {
      throw new TypeError("BYOK provider display name is required.");
    }
    if (
      definition.transport !== "direct-only" ||
      definition.supportsBrowserCors !== true
    ) {
      throw new TypeError(
        "BYOK providers must be direct-only and explicitly support browser CORS.",
      );
    }

    this.#endpointUrl = resolveDirectByokUrl(
      definition.endpointUrl,
      definition.allowedProviderOrigins,
    );
    this.#fetch = fetchImpl ?? defaultFetch();
    this.id = definition.id;
    this.displayName = definition.displayName.trim();
  }

  get endpointOrigin(): string {
    return this.#endpointUrl.origin;
  }

  protected abstract encodeRequestBody(
    modelId: string,
    payload: ValidatedGenerationPayload,
  ): unknown;

  protected abstract authorizationHeaders(apiKey: string): HeadersInit;

  async generate(request: DirectByokGenerationRequest): Promise<Response> {
    const modelId = request.modelId.trim();
    if (
      !modelId ||
      modelId.length > 160 ||
      CONTROL_CHARACTERS.test(modelId)
    ) {
      throw new TypeError("BYOK model id is invalid.");
    }
    if (
      !request.apiKey.trim() ||
      request.apiKey.length > 4_096 ||
      CONTROL_CHARACTERS.test(request.apiKey)
    ) {
      throw new TypeError("BYOK API key is invalid.");
    }

    const payload = validateStructuredGenerationPayload(request.payload);
    const headers = new Headers(this.authorizationHeaders(request.apiKey));
    headers.set("Accept", "application/json");
    headers.set("Content-Type", "application/json");

    return this.#fetch(this.#endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(this.encodeRequestBody(modelId, payload)),
      credentials: "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
  }
}

