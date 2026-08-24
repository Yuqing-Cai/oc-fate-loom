import { resolveDefaultRelayUrl, type DefaultRelayEndpointPolicy } from "./endpoint-policy";
import { UNCONFIGURED_EXECUTION_GUARDS } from "./execution-guards";
import {
  validateStructuredGenerationPayload,
  type FetchLike,
  type StructuredGenerationPayload,
} from "./types";

export interface DefaultRelayClientOptions extends DefaultRelayEndpointPolicy {
  readonly relayUrl: string;
  readonly fetchImpl?: FetchLike;
}

function defaultFetch(): FetchLike {
  if (typeof globalThis.fetch !== "function") {
    throw new Error("Fetch is not available in this environment.");
  }
  return globalThis.fetch.bind(globalThis);
}

/**
 * Owner-funded route. It accepts only structured story inputs. Provider,
 * model, system prompt, upstream URL, and owner credentials remain server-side.
 */
export class DefaultRelayClient {
  readonly transport = "owner-relay" as const;
  readonly guards = UNCONFIGURED_EXECUTION_GUARDS;
  readonly #relayUrl: URL;
  readonly #fetch: FetchLike;
  readonly #appOrigin: string;

  constructor(options: DefaultRelayClientOptions) {
    this.#relayUrl = resolveDefaultRelayUrl(options.relayUrl, options);
    this.#appOrigin = new URL(options.appOrigin).origin;
    this.#fetch = options.fetchImpl ?? defaultFetch();
  }

  get relayOrigin(): string {
    return this.#relayUrl.origin;
  }

  async generate(payload: StructuredGenerationPayload): Promise<Response> {
    const validated = validateStructuredGenerationPayload(payload);
    return this.#fetch(this.#relayUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validated),
      credentials:
        this.#relayUrl.origin === this.#appOrigin ? "same-origin" : "omit",
      redirect: "error",
      referrerPolicy: "no-referrer",
    });
  }
}

