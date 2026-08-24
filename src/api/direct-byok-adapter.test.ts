import { describe, expect, it, vi } from "vitest";

import {
  DirectByokAdapter,
  type DirectByokProviderDefinition,
} from "./direct-byok-adapter";
import {
  createDirectByokRegistry,
  directByokRegistry,
} from "./direct-byok-registry";
import type {
  FetchLike,
  ValidatedGenerationPayload,
} from "./types";

const DEFINITION: DirectByokProviderDefinition = {
  id: "reviewed-provider",
  displayName: "Reviewed Provider",
  transport: "direct-only",
  endpointUrl: "https://api.provider.example/v1/generate",
  allowedProviderOrigins: ["https://api.provider.example"],
  supportsBrowserCors: true,
};

class TestDirectAdapter extends DirectByokAdapter {
  constructor(definition: DirectByokProviderDefinition, fetchImpl?: FetchLike) {
    super(definition, fetchImpl);
  }

  protected encodeRequestBody(
    modelId: string,
    payload: ValidatedGenerationPayload,
  ): unknown {
    return { model: modelId, input: payload };
  }

  protected authorizationHeaders(apiKey: string): HeadersInit {
    return { Authorization: `Bearer ${apiKey}` };
  }
}

describe("DirectByokAdapter", () => {
  it("starts with an empty global provider registry", () => {
    expect(directByokRegistry.list()).toEqual([]);
    expect(directByokRegistry.get("anything")).toBeUndefined();
  });

  it("sends a transient key directly to the reviewed provider origin", async () => {
    const fetchSpy = vi.fn<FetchLike>(async () => new Response("{}"));
    const adapter = new TestDirectAdapter(DEFINITION, fetchSpy);

    await adapter.generate({
      modelId: "provider-model-id",
      apiKey: "temporary-secret",
      payload: {
        schemaVersion: 1,
        locale: "en",
        mode: "timeline",
        selections: [{ axisId: "world", optionId: "W1" }],
      },
    });

    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toBe(
      "https://api.provider.example/v1/generate",
    );
    expect(init?.credentials).toBe("omit");
    expect(init?.redirect).toBe("error");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer temporary-secret",
    );
    expect(JSON.stringify(adapter)).not.toContain("temporary-secret");
  });

  it("rejects relay-like or unreviewed provider definitions", () => {
    expect(
      () =>
        new TestDirectAdapter({
          ...DEFINITION,
          supportsBrowserCors: false,
        } as unknown as DirectByokProviderDefinition),
    ).toThrow(/direct-only.*CORS/i);

    expect(
      () =>
        new TestDirectAdapter({
          ...DEFINITION,
          endpointUrl: "https://relay.example/provider-proxy",
        }),
    ).toThrow(/not allowlisted/i);
  });

  it("rejects duplicate adapters in an immutable registry", () => {
    const first = new TestDirectAdapter(DEFINITION, vi.fn<FetchLike>());
    const second = new TestDirectAdapter(DEFINITION, vi.fn<FetchLike>());
    expect(() => createDirectByokRegistry([first, second])).toThrow(
      /duplicate BYOK provider/i,
    );
  });
});

