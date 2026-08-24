# API boundaries

The browser has two deliberately separate generation routes. They share the
story-input schema, but they do not share credentials, endpoint configuration,
or fallback behavior.

## 1. Owner-funded default relay

`DefaultRelayClient` sends a narrow `StructuredGenerationPayload` to a
site-owned relay:

```text
browser ── structured story input ──> owner relay ──> chosen provider
                                          │
                                          ├─ provider and model
                                          ├─ system instructions
                                          └─ owner credential
```

The browser payload contains only:

- schema version;
- locale;
- output mode;
- stable axis/option selections;
- optional additional user direction.

Unknown properties are rejected at runtime. In particular, the default client
does not accept a provider, model, system prompt, upstream endpoint, API key,
or other credential from the browser. The relay must select and enforce those
values server-side.

The relay endpoint may be a same-origin HTTPS path. A cross-origin relay is
allowed only when its exact HTTPS origin is present in
`allowedRelayOrigins`. Browser cookies are omitted for cross-origin relays.

No default relay client is instantiated by the API package. Enabling this
route requires an explicit application configuration and a deployed relay.

## 2. Visitor-funded direct BYOK

`DirectByokAdapter` never calls the owner relay:

```text
browser ── visitor key + request ──> reviewed provider origin
```

Every provider adapter must be committed in code and declare:

- `transport: "direct-only"`;
- `supportsBrowserCors: true` after an actual browser-level review;
- one fixed HTTPS endpoint;
- an exact provider-origin allowlist;
- provider-specific request encoding and authorization headers.

The UI may let a visitor choose a registered provider and type a model ID, but
it must not accept an arbitrary endpoint URL. The direct registry is empty by
default. There is no legacy provider, proxy fallback, or generic
OpenAI-compatible endpoint hidden behind it.

The adapter receives a key only for the duration of one call. It never stores
the key as an instance property. Application code should obtain the value
through `TransientKeyHolder.withKey(...)` and pass it directly into the
adapter call.

## 3. URL policy

All endpoint and allowlist values pass through the shared `new URL(...)`
policy in `endpoint-policy.ts`.

The policy rejects:

- backslashes before parsing;
- non-HTTPS protocols;
- embedded usernames or passwords;
- fragments;
- malformed or non-origin allowlist entries;
- any resolved origin not in the appropriate exact allowlist.

The default relay permits its own application origin automatically. Direct
BYOK has no automatic origin and therefore fails closed when its allowlist is
empty.

## 4. Execution guards are contracts, not active features

Timeouts, caller-driven abort, upstream error redaction, and response-size
limits are represented by `UNCONFIGURED_EXECUTION_GUARDS`. Every guard is
explicitly disabled and contains no guessed value.

Before either route is made available to the public, replace the disabled
contract with an enforced policy and add tests proving:

1. timeout cancellation and cleanup;
2. caller cancellation behavior;
3. provider errors cannot reveal URLs, headers, bodies, or credentials;
4. streamed and non-streamed output stop at a documented byte/token limit;
5. rate limits, abuse controls, and relay authentication fail closed.

The current package intentionally does not pretend that these production
controls exist.

