# Quark Recursive Downloads

This branch adds recursive file collection for folders selected in the user's
Quark drive, including folders saved from a share. Share pages retain their
existing file-only behavior.

In LinkSwift's Aria2 settings, set the download directory to an absolute path
on the downloader machine (for example `/home/user/Downloads`). Select a
folder in the Quark drive, choose Aria2 download, then push the generated tasks.
The selected folder and its descendants are preserved below that directory.
Other download modes collect files but do not preserve the directory tree.
Empty directories are not created.

The implementation lists `/1/clouddrive/file/sort` in pages of 100, traverses
subfolders, deduplicates by file ID and fails on listing errors. Download URL
responses are matched back to their file IDs to preserve their relative paths.
Aria2 tasks receive the original filename, headers and a per-file directory.

## Validation

Run:

```sh
node --test tests/quark-recursive.test.cjs
node --check '（改）网盘直链下载助手.user.js'
npx --no-install eslint '（改）网盘直链下载助手.user.js' tests/quark-recursive.test.cjs
```

- Six automated tests cover nested folders, pagination, duplicate selections,
  same-name files, empty folders, direct files, failed listing, path traversal,
  RPC forwarding and reordered download responses.
- A live Ghost Downloader 4.3.7 RPC test created `Root/Child/check.txt` with
  matching contents under a temporary test directory.
- The user installed the modified script and confirmed the Quark workflow
  works in their real account. The exact folder depth and file count were not
  reported; pagination and same-name files are covered by automated tests.
- Existing userscript lint warnings about unused `items` and `token` remain.

Directory API reference:
https://github.com/OpenListTeam/OpenList/blob/main/drivers/quark_uc/util.go
