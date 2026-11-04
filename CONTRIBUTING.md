# Contributing

Edit authored files, regenerate `registry.json`, and run `npm run check`. Tests use `tests/consumer/` so removing the authoring example does not remove conformance coverage. Never add assessment artifacts or source-execution hooks to registry validation.

## Structural contract

Schemas and pure helpers are vendored in `contracts/`. `contracts.lock.json` records the Nosey source revision, every file digest, the aggregate bundle digest, parser versions, and the built-in inventory's catalog identity. The file digests identify development changes even when their source revision is not yet a release. Validation never downloads changing schemas.

Nosey owns this contract. From the compatible Nosey checkout, explicitly run:

```sh
node scripts/export-registry-contract.mjs /absolute/path/to/template/contracts
```

Review the whole bundle and lock diff. Update Nosey's vendored producer fixture and the template's exact consumer pin together. Run both repositories' consumer suites before publishing compatibility. Do not change a vendored helper independently from the runtime.

Version 1 rejects unknown fields, cross-custom-registry references, built-in redefinitions, unsafe relative paths, symlinks, special files and incomplete walks. IDs are lowercase and case-sensitive. Skill names contain 1–64 lowercase letters/digits separated by single hyphens; descriptions are nonempty strings of at most 1024 characters. A nonempty Markdown body is sufficient; prose quality is outside this validator.

Each skill hash is SHA-256 over a canonical JSON list of `[relative-path, byte-size, file-SHA-256]` records sorted by normalized relative path. Every supported regular asset and `SKILL.md` participates; timestamps and file modes do not. Binary supporting assets are allowed. The pinned installer reserves `metadata.json`, `.git`, `__pycache__`, and `__pypackages__`; these asset names are rejected rather than silently omitted. Eve installation is currently rejected because that installer rewrites its frontmatter. Other supported agent choices and project/global scopes use the existing installer.

Bounds: 2 MiB per skill file, 32 MiB per registry's assets, 4096 files, 24 directory levels, 10 MiB per manifest, 128 signals per technology and 4096 per registry (8192 across composed custom sources), 1024 technologies and combinations, and 32 combination requirements. Regexes are syntax-checked and bounded to 1024 characters; execution uses Nosey's existing isolated, timed regex worker. Globs have bounded brace expansion. Custom definitions compete by descending integer priority and then ascending source configuration ID; built-in identities remain protected. Augmentations are additive.

## Required checks

```sh
npm ci --ignore-scripts
npm run check
npm run build -- --check
NOSEY_PACKAGE=/absolute/path/to/candidate.tgz npm run test:consumer
npm run build:manifest -- --revision <full-source-commit> --out /tmp/registry-one
npm run build:manifest -- --revision <same-full-source-commit> --out /tmp/registry-two
diff -r /tmp/registry-one /tmp/registry-two
git diff --check
```

Use exact candidate tarballs during development. A released pin requires the package version **and** npm integrity; moving `main` references do not establish consumer compatibility. Workflow publication must use CI's exact artifact, never rebuild after validation. Manual generation must stay on the selected branch and preserve the generated-file allowlist.
