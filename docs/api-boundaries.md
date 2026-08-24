# API boundaries

No generation route is enabled. The code reserves two separate integration
paths for future work; neither is wired to a live client or execution path.

The draft payload below is not yet compatible with the app's dotted axis IDs
or its `outline` / `full` output modes. Treat it as a boundary sketch, not a
public API contract. Before either route opens, the payload types, validator,
and app adapter must be revised together and covered by end-to-end tests.

## 1. Owner-funded default relay

The owner-funded route is intended to send a narrow
`StructuredGenerationPayload` to a site-owned relay:

```text
browser ── structured story input ──> owner relay ──> chosen provider
                                          │
                                          ├─ provider and model
                                          ├─ system instructions
                                          └─ owner credential
```

The current draft payload contains only:

- schema version;
- locale;
- output mode;
- short selection identifiers (not yet mapped from the app's dotted IDs);
- optional additional user direction.

Unknown properties are rejected at runtime. The default client
does not accept a provider, model, system prompt, upstream endpoint, API key,
or other credential from the browser. The relay must select and enforce those
values server-side.

The relay endpoint may be a same-origin HTTPS path. A cross-origin relay is
allowed only when its exact HTTPS origin is present in
`allowedRelayOrigins`. Browser cookies are omitted for cross-origin relays.

No default relay client is instantiated by the API package. Enabling this
route requires an explicit application configuration and a deployed relay.

## 2. Visitor-funded direct BYOK

The visitor-funded bring-your-own-key (BYOK) route is intended to call a
reviewed provider directly rather than the owner relay:

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
default. Only registered provider adapters are accepted.

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

## 4. Execution guards not implemented

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

No provider or relay may be enabled until these controls are implemented and
tested.
