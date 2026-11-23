# Provider adapters

Each cloud provider must be isolated behind the `ProviderAdapter` contract.

A provider adapter is responsible for:

1. detecting whether the current page belongs to the provider;
2. reading only the provider-specific authentication/context data it needs;
3. listing/normalizing selected files;
4. resolving a selected file into a `DownloadTask`;
5. translating provider errors into stable LinkSwift errors.

A provider adapter must **not** know how Aria2, cURL, IDM, Motrix, or any other downloader works.

Target layout:

```text
src/providers/
  baidu/
  aliyun/
  yidong/
  tianyi/
  xunlei/
  guangya/
  quark/
  uc/
  pan123/
```

Migration should be incremental. Keep the legacy userscript behavior as the compatibility baseline until each adapter has fixture coverage.
