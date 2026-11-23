# LinkSwift architecture (incremental refactor)

## Goal

Turn the current large userscript into explicit, testable boundaries without breaking existing provider behavior.

```text
Page / Userscript runtime
        |
        v
Provider Adapter
        |
        v
  DownloadTask
        |
        +---------------------+
        |          |          |
        v          v          v
     Browser     Aria2       cURL     ...
```

## Core rule

Provider-specific data stops at `DownloadTask`.
Downloader-specific data starts after `DownloadTask`.
UI code should orchestrate the two but contain neither provider API details nor downloader protocol details.

## Modules

### `src/core/download-task.js`

Canonical immutable download description. It carries URL, filename, headers, method, expiration and minimal metadata.

### `src/core/provider-adapter.js`

Contract for Baidu, Aliyun, Quark, UC, 123Pan and other providers.

### `src/core/downloader-adapter.js`

Contract for Browser, Aria2, cURL, IDM, Motrix, BitComet and future targets.

### `src/core/adapter-registry.js`

Central registry that avoids growing switch statements and enables provider/downloader plug-ins.

### `src/downloaders/*`

Pure transformation code. These modules are intentionally DOM-free so they can be unit tested in Node.

## Dependency direction

Allowed:

```text
ui -> provider -> core
ui -> downloader -> core
```

Forbidden:

```text
provider -> downloader
provider -> UI
core -> provider
core -> downloader
```

## Compatibility strategy

The legacy userscript remains the behavioral baseline during migration. Each provider should be moved behind an adapter one at a time and covered by fixtures before old code is removed.
