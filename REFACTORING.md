# LinkSwift refactor — Stage 1

This patch is intentionally conservative. It introduces the architecture required to split the current userscript without replacing working provider implementations in one high-risk change.

## What changes

- canonical immutable `DownloadTask` model;
- provider and downloader adapter contracts;
- adapter registry;
- Browser, Aria2 and cURL downloader modules;
- unit tests and smoke test;
- architecture, migration, development and security documentation;
- an ADR documenting why migration is incremental.

## What does not change yet

- existing userscript runtime behavior;
- provider API logic;
- settings storage format;
- DOM selectors and UI rendering;
- distribution/update channel.

## Review order

1. `docs/ARCHITECTURE.md`
2. `src/core/download-task.js`
3. `src/core/adapter-registry.js`
4. `src/downloaders/aria2.js`
5. `src/downloaders/curl.js`
6. `tests/`
7. `docs/MIGRATION.md`

The next PR should migrate one provider end-to-end and retain a legacy fallback for one release.

## Runtime bridge

The distributable userscript now exposes download.task(index). Normal/enhanced downloads, downloader dispatch, and copy/command generation consume its normalized fields. This is a plain-object compatibility bridge, not a bundled instance of the core DownloadTask class.

The supplied patch was applied with one defensive adjustment: optional access to files prevents a malformed legacy configuration from throwing. Tests execute the actual state/task methods extracted from the userscript and cover metadata preservation and invalid state. Live cloud-provider and downloader integration checks remain manual.
