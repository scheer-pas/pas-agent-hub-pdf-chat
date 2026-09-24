## Skills

Use this folder to store your project-specific skills.

### Supported agents and models

For the current list of supported agents and supported models, see the Vercel Skills documentation:

- [Supported agents and models](https://github.com/vercel-labs/skills#supported-agents)

### Configure skill sources and agents

You can configure where skills are loaded from, and which agents receive them, in `.pas/skills-sources.json`.

```json
{
  "agents": ["claude-code", "junie", "universal"],
  "sources": ["./node_modules/@pas/dev-guidelines", "./.pas/skills"],
  "gitignore": false
}
```

- Update `agents` to match the agents that you use in your environment.
- Update `sources` to control which local folders or packages provide skills.
- Keep `./.pas/skills` in `sources` when you want to include the skills from this folder.
- Set `gitignore` to `true` to add the linked skills to the per-directory `.gitignore` files so they stay out of version control. It defaults to `false`, leaving the linked skills tracked by git.
