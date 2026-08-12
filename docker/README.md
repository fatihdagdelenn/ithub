# docker/

`host-ca-bundle.crt` (if present here) is an **optional, local-only** CA bundle trusted during
`docker build`. It's needed only on networks that sit behind a TLS-inspecting proxy (some
corporate or sandboxed dev environments) where `apk add`/`npm ci` would otherwise fail with
"TLS: server certificate not trusted".

- This file is git-ignored on purpose — it's specific to one machine/network, not something to
  ship or commit.
- If you don't have this problem (most people, including CI), you don't need this file at all;
  the build works the same without it.
- If you do need it: export your system/proxy's CA trust store to `docker/host-ca-bundle.crt`
  (e.g. on Debian/Ubuntu-based hosts, `/etc/ssl/certs/ca-certificates.crt` after your IT-provided
  proxy CA has been installed into the OS trust store) and rebuild.
