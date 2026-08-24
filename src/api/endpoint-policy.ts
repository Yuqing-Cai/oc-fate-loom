export type EndpointPolicyErrorCode =
  | "invalid-url"
  | "backslash"
  | "non-https"
  | "credentials"
  | "fragment"
  | "invalid-origin"
  | "origin-not-allowed";

export class EndpointPolicyError extends Error {
  readonly code: EndpointPolicyErrorCode;

  constructor(code: EndpointPolicyErrorCode, message: string) {
    super(message);
    this.name = "EndpointPolicyError";
    this.code = code;
  }
}

function rejectBackslash(value: string): void {
  if (value.includes("\\")) {
    throw new EndpointPolicyError(
      "backslash",
      "Endpoint URLs must not contain backslashes.",
    );
  }
}

function assertSafeHttpsUrl(url: URL): URL {
  if (url.protocol !== "https:") {
    throw new EndpointPolicyError(
      "non-https",
      "Endpoint URLs must use HTTPS.",
    );
  }
  if (url.username || url.password) {
    throw new EndpointPolicyError(
      "credentials",
      "Endpoint URLs must not contain credentials.",
    );
  }
  if (url.hash) {
    throw new EndpointPolicyError(
      "fragment",
      "Endpoint URLs must not contain fragments.",
    );
  }
  return url;
}

function parseAbsoluteHttpsUrl(value: string): URL {
  rejectBackslash(value);
  try {
    return assertSafeHttpsUrl(new URL(value));
  } catch (error) {
    if (error instanceof EndpointPolicyError) throw error;
    throw new EndpointPolicyError("invalid-url", "Endpoint URL is invalid.");
  }
}

function parseExactOrigin(value: string): string {
  const url = parseAbsoluteHttpsUrl(value);
  if (
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.origin !== value.replace(/\/$/, "")
  ) {
    throw new EndpointPolicyError(
      "invalid-origin",
      "Origin allowlist entries must be exact HTTPS origins.",
    );
  }
  return url.origin;
}

function allowedOriginSet(origins: readonly string[]): ReadonlySet<string> {
  return new Set(origins.map(parseExactOrigin));
}

export interface DefaultRelayEndpointPolicy {
  /** Exact browser application origin, normally window.location.origin. */
  readonly appOrigin: string;
  /** Cross-origin relay origins explicitly approved by the site owner. */
  readonly allowedRelayOrigins?: readonly string[];
}

/**
 * Resolves a same-origin relative relay path or an explicitly allowlisted
 * HTTPS relay. Browser-controlled provider URLs never pass through here.
 */
export function resolveDefaultRelayUrl(
  relayUrl: string,
  policy: DefaultRelayEndpointPolicy,
): URL {
  rejectBackslash(relayUrl);
  const appOrigin = parseExactOrigin(policy.appOrigin);

  let resolved: URL;
  try {
    resolved = assertSafeHttpsUrl(new URL(relayUrl, `${appOrigin}/`));
  } catch (error) {
    if (error instanceof EndpointPolicyError) throw error;
    throw new EndpointPolicyError("invalid-url", "Relay URL is invalid.");
  }

  const allowed = allowedOriginSet([
    appOrigin,
    ...(policy.allowedRelayOrigins ?? []),
  ]);
  if (!allowed.has(resolved.origin)) {
    throw new EndpointPolicyError(
      "origin-not-allowed",
      "Relay origin is not allowlisted.",
    );
  }
  return resolved;
}

/**
 * Direct BYOK endpoints must be absolute and match a reviewed provider origin
 * exactly. There is no proxy or arbitrary user-entered endpoint fallback.
 */
export function resolveDirectByokUrl(
  endpointUrl: string,
  allowedProviderOrigins: readonly string[],
): URL {
  const endpoint = parseAbsoluteHttpsUrl(endpointUrl);
  const allowed = allowedOriginSet(allowedProviderOrigins);
  if (allowed.size === 0 || !allowed.has(endpoint.origin)) {
    throw new EndpointPolicyError(
      "origin-not-allowed",
      "Direct provider origin is not allowlisted.",
    );
  }
  return endpoint;
}

