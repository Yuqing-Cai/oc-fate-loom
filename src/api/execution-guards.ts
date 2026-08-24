export interface DisabledExecutionGuard {
  readonly enabled: false;
  readonly reason: "not-configured";
}

export interface ApiExecutionGuardContract {
  readonly timeout: DisabledExecutionGuard & {
    readonly timeoutMs: null;
  };
  readonly abort: DisabledExecutionGuard & {
    readonly acceptsCallerSignal: false;
  };
  readonly errorRedaction: DisabledExecutionGuard & {
    readonly publicErrorMap: null;
  };
  readonly outputLimit: DisabledExecutionGuard & {
    readonly maxBytes: null;
  };
}

/**
 * Guard shapes are intentionally defined before provider integration, but no
 * value is silently invented. A production route must replace this contract
 * explicitly and add enforcement tests before it is enabled.
 */
export const UNCONFIGURED_EXECUTION_GUARDS: ApiExecutionGuardContract =
  Object.freeze({
    timeout: Object.freeze({
      enabled: false,
      reason: "not-configured",
      timeoutMs: null,
    }),
    abort: Object.freeze({
      enabled: false,
      reason: "not-configured",
      acceptsCallerSignal: false,
    }),
    errorRedaction: Object.freeze({
      enabled: false,
      reason: "not-configured",
      publicErrorMap: null,
    }),
    outputLimit: Object.freeze({
      enabled: false,
      reason: "not-configured",
      maxBytes: null,
    }),
  });

