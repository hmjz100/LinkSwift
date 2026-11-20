# Security notes for the refactor

LinkSwift executes on authenticated cloud-storage pages and has privileged userscript capabilities. Treat its update channel and dependency chain as security-sensitive.

## Rules

- Never log access tokens, cookies, BDUSS-like credentials, authorization headers or signed download URLs.
- Keep credentials in memory for the shortest practical lifetime.
- Prefer scoped access tokens to broad session cookies when provider APIs support them.
- Do not persist resolved download URLs unless required; many are signed and short-lived.
- Do not send provider credentials to downloader RPC endpoints unless the downloader is explicitly trusted by the user.
- Sanitize test fixtures. Replace account IDs, tokens, cookies, signatures, filenames containing personal data and real download hosts when not required by the test.
- Narrow userscript `@connect` permissions as provider adapters are migrated and their exact hosts are known.
- Pin or integrity-check external runtime dependencies where the userscript platform permits it.

## Threat boundaries

```text
Cloud provider page
  -> userscript privileged runtime
  -> provider adapter
  -> DownloadTask (may contain secrets)
  -> downloader adapter
  -> local/remote downloader
```

`DownloadTask` is a sensitive object because headers/cookies may carry authorization. Do not serialize it to analytics or generic logs.
