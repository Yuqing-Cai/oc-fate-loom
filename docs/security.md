# Security design

## Trust model

The browser, browser extensions, local device, and all user-entered values are
untrusted. The repository is public, so build-time values and all `VITE_*`
environment variables must be treated as public information.

The owner-funded API credential belongs only in a server-side secret store. It
must never appear in source code, a frontend environment variable, a Pages
artifact, browser storage, telemetry, or an error response.

## Credential handling

### Owner-funded route

- The browser sends only the allowlisted structured story payload.
- The relay chooses provider, model, system instructions, and upstream URL.
- The relay attaches the owner credential server-side.
- The browser cannot override any of those fields.

### Direct BYOK route

- A visitor key is held only in the closure-backed `TransientKeyHolder`.
- It is never included in serializable application state.
- `pageshow`, `pagehide`, explicit clear, and lifecycle disposal erase it.
- The adapter does not retain the key after the call.
- The request goes directly to a reviewed provider origin with
  `credentials: "omit"` and `redirect: "error"`.

Browser-memory-only handling reduces accidental persistence; it does not make
an untrusted browser equivalent to a server secret store. Malicious
extensions, injected scripts, a compromised device, and the provider itself
can still observe a key during use. The UI must advise visitors to use a
limited, revocable, purpose-specific key and decline password-manager saving.

## Endpoint controls

- All parsing uses the platform `URL` implementation.
- Backslashes, credentials, fragments, malformed values, and non-HTTPS URLs
  are rejected.
- Allowlist entries are exact origins, not suffix or substring matches.
- The default relay is same-origin unless an additional relay origin is
  explicitly committed.
- BYOK endpoints come from reviewed adapters, never free-form visitor input.
- Provider registration requires confirmed browser CORS support.

DNS, TLS, CORS, and provider behavior can change after review. Revalidate an
adapter before every release and when its endpoint or provider policy changes.

## Data minimization

Do not log or persist:

- API keys or authorization headers;
- complete request/response bodies;
- user prompts unless a separate, disclosed retention feature is approved;
- credential-bearing URLs;
- browser-storage snapshots.

Use stable request IDs and coarse outcome codes for diagnostics. Production
error messages must be mapped to a small public error vocabulary before API
access is enabled.

## Controls intentionally not enabled yet

The code defines, but does not currently enforce, contracts for:

- request timeout;
- AbortSignal propagation;
- upstream error redaction;
- output byte/token limits.

This is an explicit release blocker, not a safe default. No provider or relay
should be registered until these controls, rate limiting, abuse prevention,
and end-to-end tests are implemented.

## Release checklist

- [ ] No secret appears in source, Git history, Pages artifacts, or `VITE_*`.
- [ ] Default relay accepts only the structured payload and validates again on
      the server.
- [ ] Provider/model/system instructions are fixed or allowlisted server-side.
- [ ] Each BYOK endpoint matches its exact reviewed origin.
- [ ] Browser CORS behavior is tested from the deployed site origin.
- [ ] Timeout, cancellation, error redaction, and output limits are enforced.
- [ ] Rate limits and abuse controls are enabled on the relay.
- [ ] CSP `connect-src` contains only routes that are actually enabled.
- [ ] Key-clear behavior is tested across reload, navigation, and BFCache.
- [ ] Logs and error monitoring are checked for prompt and credential leakage.

