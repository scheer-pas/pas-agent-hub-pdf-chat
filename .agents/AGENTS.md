## Guidelines

This repository follows the PAS dev guidelines. **Read the guidelines** in `node_modules/@pas/dev-guidelines/src/AGENTS.md` each time a file is generated, modified, or reviewed.

## Monorepo Structure

This is an Nx-based monorepo. Packages live under the `packages/` directory and are organized by domain. A typical domain contains:

- `service/impl` — NestJS backend service implementation
- `service/types` — Shared TypeScript types/interfaces for the service
- `service/client` — Service client library for consuming the service API
- `app/impl` — Angular frontend application

To discover the exact package paths and domain folders, inspect the `packages/` directory and the `project.json` files within it.

## TypeScript Path Aliases

Cross-package imports use path aliases defined in `tsconfig.base.json`. Always use these aliases instead of relative paths when importing from another package.

To find the available aliases and their mapped paths, check the `paths` section in `tsconfig.base.json` at the repository root.

## Nx Workspace Commands

Use the scripts section in the package.json to build, serve, test, and lint projects:

## Agent Skills

The skill sources and the agents they are linked for are declared in `.pas/skills-sources.json`. By default skills come from `@pas/dev-guidelines` and are made available to the agents listed there (e.g. `claude-code`, `junie`, `universal`).

### Automatic Linking

When you run `npm install`, skills are linked automatically by the `pas-link-skills` command (wired as the `postinstall` script).
If you add a new source or need to re-link manually, run:

```bash
npx pas-link-skills
```

### Adding a skill source

Declare additional sources in `.pas/skills-sources.json`. A source can be an installed package, a git reference, or a local folder:

```json
{
  "agents": ["claude-code", "junie", "universal"],
  "sources": ["./node_modules/@pas/dev-guidelines"]
}
```
