# Migration plan

## Phase 1 — foundation (this change)

- Introduce `DownloadTask`.
- Introduce provider/downloader adapter contracts and registries.
- Move cURL and Aria2 output generation toward pure modules.
- Add Node unit tests and a smoke check.
- Document boundaries and security rules.
- Add a behavior-preserving `download.task(index)` runtime bridge in the userscript so UI actions consume one normalized transfer shape.
- Do **not** change provider API behavior yet.

## Phase 1.1 — userscript runtime bridge

The runtime bridge is included in the distributable userscript. The original `LinkSwift-userscript-download-task-bridge.patch` was applied after the foundation. It centralizes the repeated legacy `state → file → link/name/size/headers` extraction behind `download.task(index)`. The bridge deliberately returns a plain object compatible with the `DownloadTask` field names because the monolithic userscript does not yet have a module build step.

This bridge is a migration seam, not a second permanent task model. Phase 5 replaces it with the bundled `DownloadTask` implementation.

## Phase 2 — first provider pilot

Recommended pilot: Quark or 123Pan, because the migration can be isolated from Baidu's larger compatibility surface.

For one provider:

1. capture sanitized API response fixtures;
2. create `src/providers/<provider>/adapter.js`;
3. normalize file records;
4. return `DownloadTask` from `resolveDownload()`;
5. route existing UI actions through the downloader registry;
6. compare generated Aria2/cURL output with the legacy implementation;
7. keep a fallback to legacy code for one release.

## Phase 3 — migrate remaining providers

Move providers individually. Do not mix provider migrations in a single pull request unless they share a tested core change.

## Phase 4 — UI extraction

Extract modal rendering, settings, storage, toast/message helpers and DOM mounting into dedicated modules.

## Phase 5 — build artifact

Introduce a deterministic build step that bundles modules into the distributable `.user.js` file. The checked-in userscript becomes generated output and receives a reproducibility check in CI.

## Exit criteria

The monolithic userscript can be retired only after:

- all supported providers use adapters;
- all supported download methods use downloader adapters;
- config migration is complete;
- fixture tests cover provider normalization;
- generated userscript passes browser smoke tests;
- a rollback path is documented.
