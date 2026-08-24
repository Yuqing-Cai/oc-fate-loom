import { describe, expect, it } from "vitest";

import {
  EndpointPolicyError,
  resolveDefaultRelayUrl,
  resolveDirectByokUrl,
} from "./endpoint-policy";

describe("endpoint policy", () => {
  it("allows same-origin relays and explicitly allowlisted HTTPS relays", () => {
    expect(
      resolveDefaultRelayUrl("/api/generate", {
        appOrigin: "https://loom.example",
      }).href,
    ).toBe("https://loom.example/api/generate");

    expect(
      resolveDefaultRelayUrl("https://relay.example/v1/generate?version=1", {
        appOrigin: "https://loom.example",
        allowedRelayOrigins: ["https://relay.example"],
      }).href,
    ).toBe("https://relay.example/v1/generate?version=1");
  });

  it("rejects non-allowlisted relay and direct-provider origins", () => {
    expect(() =>
      resolveDefaultRelayUrl("https://evil.example/generate", {
        appOrigin: "https://loom.example",
      }),
    ).toThrowError(EndpointPolicyError);

    expect(() =>
      resolveDirectByokUrl("https://api.provider.example/v1", [
        "https://other.provider.example",
      ]),
    ).toThrow(/not allowlisted/i);
  });

  it.each([
    ["http://api.provider.example/v1", "non-https"],
    ["https://user:pass@api.provider.example/v1", "credentials"],
    ["https://api.provider.example/v1#debug", "fragment"],
    ["https://api.provider.example\\@evil.example/v1", "backslash"],
  ])("rejects unsafe URL %s", (value, code) => {
    try {
      resolveDirectByokUrl(value, ["https://api.provider.example"]);
      throw new Error("Expected endpoint validation to fail.");
    } catch (error) {
      expect(error).toBeInstanceOf(EndpointPolicyError);
      expect((error as EndpointPolicyError).code).toBe(code);
    }
  });

  it("requires exact, normalized origin entries", () => {
    expect(() =>
      resolveDirectByokUrl("https://api.provider.example/v1", [
        "https://api.provider.example/some-path",
      ]),
    ).toThrow(/exact HTTPS origins/i);

    expect(() =>
      resolveDirectByokUrl("https://api.provider.example/v1", []),
    ).toThrow(/not allowlisted/i);
  });
});

