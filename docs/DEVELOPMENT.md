# Development guide

## Requirements

- Node.js 20+
- npm

## Checks

```bash
npm test
npm run test:smoke
npm run check:refactor
```

The refactored core deliberately has no browser dependency. Keep pure transformations in `src/core` and `src/downloaders` so they remain fast to test.

## Adding a downloader

1. extend `DownloaderAdapter`;
2. give it a stable `id`;
3. accept `DownloadTask` as input;
4. return a command/request description rather than touching the DOM;
5. add unit tests;
6. register it in `createDefaultDownloaderRegistry()`.

## Adding a provider

1. extend `ProviderAdapter`;
2. isolate all provider-specific request/response handling;
3. sanitize fixtures before committing them;
4. return `DownloadTask` from `resolveDownload()`;
5. never pass raw provider responses to downloader modules.

## Pull-request size

Prefer migration PRs that affect one provider or one cross-cutting subsystem. Large mechanical moves should be separated from behavioral changes.

## Command output

cURL generation supports POSIX shells and PowerShell (curl.exe). cmd and unknown shell formats are rejected because simple quoting does not protect against variable expansion.
