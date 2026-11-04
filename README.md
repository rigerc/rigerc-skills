# rigerc-skills

A Nosey custom registry containing rigerc’s skills, including herdr-management. The skills are indexed for browsing; technology mappings and detection rules are currently empty.

This is a **development template for Nosey 0.6.0-dev.0**. Unmodified Nosey 0.5.0 cannot consume this contract. A compatible released consumer has not been pinned yet; publication CI fails closed until [consumer.lock.json](consumer.lock.json) contains the released version and npm integrity. Local authoring works independently of Nosey.

## Start a registry

Use Node.js 22 or newer. Copy this repository, then run:

```sh
npm ci --ignore-scripts
node scripts/configure.mjs acme/team-skills
npm run build
npm run check
```

Commit `registry.json` alongside the authored inputs. Configure rewrites the registry identity and its local skill references together; repeated configuration makes no further changes. Build never rewrites skill instructions or authored rules.

## Author content

- `skills/**/SKILL.md`: YAML `name` and `description`, followed by a nonempty Markdown body. Groups and supporting assets are supported. A nested `SKILL.md` inside a skill is an asset.
- `data/technology-detection-rules.json`: custom technologies with `dependency`, `path`, `glob`, `extension`, `content`, and `mcp_package` signals. Signals use OR; combination requirements use AND. A technology can have no skill mapping.
- `data/mappings.json`: technology mappings, explicit built-in augmentations, combinations, and optional `frontend_essentials` / `always_recommend` lists. Broad lists default to empty. Discovering a skill does not recommend it automatically.
- `registry.config.json`: lowercase `owner/repository` identity and optional publication repository.

The example demonstrates a dependency/path detector, a detect-only marker, an additive React mapping and detector, and an AND combination. Remove its mapping references before removing its skill. See [CONTRIBUTING.md](CONTRIBUTING.md) for contract limits and bundle updates.

Validation checks structure, references, paths, and content hashes. Custom registries do not require scores, quality reports, model credentials, or assessment fields.

## Register and install

With the compatible development consumer:

```sh
nosey registry add /mnt/extra-ssd/dev/projects2/rigerc-skills --acknowledge-source
nosey registry add https://github.com/rigerc/rigerc-skills.git --ref main --acknowledge-source
nosey registry list --json
nosey registry check <source-id>
nosey registry refresh <source-id>
nosey registry priority <source-id> 10
nosey registry disable <source-id>
nosey registry enable <source-id>
nosey registry remove <source-id>
nosey scan /path/to/project --offline --json
nosey plan /path/to/project --offline --agents codex
nosey install /path/to/project --offline --agents codex --exec --yes
```

Addition without `--acknowledge-source` records a disabled candidate; use `nosey registry acknowledge <source-id>` to activate it. Acknowledgment identifies the source and enables its contributions. Installation still requires a separately reviewed execution request and the supported `skills` 1.7.4 installer.

After local edits, rebuild and refresh the registration. Git sources use resolved commits; HTTP metadata points to a full source commit whose skill assets must also be accessible. Offline scans reuse validated cached content. Failed remote refresh retains the last valid snapshot. Local content changes, disabled sources, priority changes, and changed assets invalidate earlier reviews.

## Generated-file repair and publication

Pull requests must include a fresh `registry.json`. Run `npm run build`, or dispatch **Propose generated registry update** against the source PR's branch. The workflow validates the candidate and opens or updates an automation PR containing only generated files; it never merges automatically. Enable Actions permission to create pull requests for this optional workflow.

Publication is optional. Local and Git registries work without public hosting, including private repositories.

Once the consumer release gate is satisfied, enable GitHub Pages with **GitHub Actions** as the source. **Validate custom registry** checks freshness, tests tooling and the pinned consumer, compiles twice with the same commit, and uploads exact manifest/distribution bytes. **Publish custom registry** accepts only a successful validation run of the current default-branch revision from this repository. A manual publication dispatch takes that validation run ID.

The publication workflow retains immutable objects on `registry-artifacts`, serializes deployments, checks ancestry before advancing `latest.json`, and verifies the complete deployment. Validation artifacts expire after 30 days; revalidate the current default-branch revision if its artifact has expired. Pages deployment needs contents/write, actions/read, pages/write, and id-token/write permissions.

The endpoint is `https://<owner>.github.io/<repository>/latest.json`:

```sh
nosey registry add https://acme.github.io/team-skills/latest.json --acknowledge-source
```

To inspect a publication locally:

```sh
npm run build:manifest -- --revision <full-40-character-source-commit>
node scripts/publish.mjs --verify
```

Manifest outputs live in ignored `dist/`; they contain no timestamps or host paths. Historical publication staging additionally requires Git ancestry checks through `scripts/publish.mjs`.

## Verify a development consumer

```sh
NOSEY_PACKAGE=/absolute/path/to/nosey-cli-0.6.0-dev.0.tgz npm run test:consumer
```

The harness installs that exact packed candidate in an isolated directory, compiles the checked-in conformance fixture, registers it, scans a temporary project, and plans bundled installation. Its output records the tarball SHA-256 and contract digest. Set `NOSEY_SKILLS_BIN` to an absolute executable for the pinned installer to include actual temporary installation and asset verification.

Before release, pin the real consumer version and npm integrity in `consumer.lock.json`, update the minimum consumer version in the exported contract, and run the packed consumer and live publication release checklist. No release or hosted-publication claim is implied by offline tests.
