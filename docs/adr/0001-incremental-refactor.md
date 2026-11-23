# ADR 0001: Refactor incrementally around DownloadTask

- Status: Proposed
- Date: 2026-10-28

## Context

LinkSwift has accumulated support for many providers, page variants and downloader targets in a large userscript. A full rewrite would make regression attribution difficult and would be risky because provider pages and APIs change frequently.

## Decision

Introduce a stable intermediate model (`DownloadTask`) and migrate the two sides independently:

```text
Provider response -> DownloadTask -> Downloader output
```

Keep the existing userscript as the compatibility baseline during migration.

## Consequences

Positive:

- provider and downloader logic can be tested independently;
- new downloaders no longer require edits in every provider;
- provider API changes no longer require edits in downloader code;
- migration can be reviewed and rolled back provider by provider.

Trade-offs:

- legacy and refactored code coexist temporarily;
- a later build/bundling step is still required;
- adapter boundaries add a small amount of boilerplate.
