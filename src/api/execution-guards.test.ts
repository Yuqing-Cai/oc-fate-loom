import { describe, expect, it } from "vitest";

import { UNCONFIGURED_EXECUTION_GUARDS } from "./execution-guards";

describe("execution guard contract", () => {
  it("defines every production guard without pretending it is configured", () => {
    expect(UNCONFIGURED_EXECUTION_GUARDS).toEqual({
      timeout: {
        enabled: false,
        reason: "not-configured",
        timeoutMs: null,
      },
      abort: {
        enabled: false,
        reason: "not-configured",
        acceptsCallerSignal: false,
      },
      errorRedaction: {
        enabled: false,
        reason: "not-configured",
        publicErrorMap: null,
      },
      outputLimit: {
        enabled: false,
        reason: "not-configured",
        maxBytes: null,
      },
    });
  });
});
