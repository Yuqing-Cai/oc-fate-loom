import { describe, expect, it, vi } from "vitest";

import { DefaultRelayClient } from "./default-relay-client";
import type { FetchLike, StructuredGenerationPayload } from "./types";

const VALID_PAYLOAD: StructuredGenerationPayload = {
  schemaVersion: 1,
  locale: "zh",
  mode: "opening",
  selections: [
    { axisId: "world", optionId: "W1" },
    { axisId: "motive", optionId: "M1" },
  ],
  additionalDirection: "克制，不说教。",
};

describe("DefaultRelayClient", () => {
  it("posts only the validated structured payload without upstream metadata", async () => {
    const fetchSpy = vi.fn<FetchLike>(async () =>
      new Response("{}", { status: 200 }),
    );
    const client = new DefaultRelayClient({
      relayUrl: "/api/generate",
      appOrigin: "https://loom.example",
      fetchImpl: fetchSpy,
    });

    await client.generate(VALID_PAYLOAD);

    expect(fetchSpy).toHaveBeenCalledOnce();
    const [url, init] = fetchSpy.mock.calls[0]!;
    expect(String(url)).toBe("https://loom.example/api/generate");
    expect(init?.credentials).toBe("same-origin");
    expect(init?.redirect).toBe("error");
    expect(JSON.parse(String(init?.body))).toEqual(VALID_PAYLOAD);
    expect(String(init?.body)).not.toMatch(
      /provider|model|systemPrompt|apiKey|authorization/i,
    );
  });

  it.each(["provider", "model", "modelId", "systemPrompt", "apiKey", "key"])(
    "rejects browser-authored %s fields",
    async (field) => {
      const fetchSpy = vi.fn<FetchLike>();
      const client = new DefaultRelayClient({
        relayUrl: "/api/generate",
        appOrigin: "https://loom.example",
        fetchImpl: fetchSpy,
      });
      const malicious = { ...VALID_PAYLOAD, [field]: "attacker-value" };

      await expect(
        client.generate(malicious as StructuredGenerationPayload),
      ).rejects.toThrow(/unsupported field/i);
      expect(fetchSpy).not.toHaveBeenCalled();
    },
  );

  it("omits browser credentials for an allowlisted cross-origin relay", async () => {
    const fetchSpy = vi.fn<FetchLike>(async () => new Response(null));
    const client = new DefaultRelayClient({
      relayUrl: "https://relay.example/generate",
      appOrigin: "https://loom.example",
      allowedRelayOrigins: ["https://relay.example"],
      fetchImpl: fetchSpy,
    });

    await client.generate(VALID_PAYLOAD);
    expect(fetchSpy.mock.calls[0]![1]?.credentials).toBe("omit");
  });
});

