# PAS Code Project

PAS Code is the Scheer PAS development platform for building first-class business applications and services with the help of AI, and running them on a managed Kubernetes platform. It combines a standardized full-stack toolkit — an Nx monorepo built on NestJS, Angular, and LangChain — into one consistent development experience.

## Agent Instructions & Skills

This project includes Agent skills for domain-specific guidance.

To enable skills in VS Code, refer to the [Agent Skills documentation](https://code.visualstudio.com/docs/copilot/customization/agent-skills).

---

## 🚀 Getting Started

All apps and services start locally.

### Prerequisites

| Tool              | Version | Verification                      |
| ----------------- | ------- | --------------------------------- |
| **Node.js & npm** | v24+    | `node --version && npm --version` |

### Setup Steps

#### 1️⃣ Install Dependencies

```bash
npm install
```

#### 2️⃣ Start All Apps and Services

```bash
pas start

or

npm start
```

This starts all apps and services in parallel using Nx:

| Service            | URL                                             |
| ------------------ | ----------------------------------------------- |
| Frontend (Angular) | [http://localhost:4200](http://localhost:4200)  |
| Backend (NestJS)   | [http://localhost:8080](http://localhost:80080) |

### 🐛 Debugging Services

Services are built with webpack and the compiled output (including sourcemaps)
is written to the **workspace-root `dist` folder** — e.g.
`dist/packages/pdf-chat/service/impl`. Any debug configuration must therefore
map sourcemaps from `${workspaceFolder}/dist/**`, not from a project-local
`dist` folder.

#### VS Code

A ready-to-use `.vscode/launch.json` is generated for you with two
configurations:

| Configuration                     | What it does                                                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Debug PAS service**             | Prompts for an Nx project name (e.g. `pdf-chat`), runs `nx serve <project>` and attaches the debugger automatically. Just set a breakpoint and press **F5**. |
| **Attach to running PAS service** | Attaches to an already-running service on inspector port `9229` — useful when you started it via `npm start`.                                                |

To debug a single service from scratch:

1. Open the **Run and Debug** panel (`⇧⌘D` / `Ctrl+Shift+D`).
2. Select **Debug PAS service** and press **F5**.
3. Enter the project name when prompted (e.g. `pdf-chat`).

#### WebStorm / IntelliJ IDEA

WebStorm can attach to the Node.js inspector exposed by `nx serve`:

1. Start the service with the inspector enabled:
   ```bash
   npx nx serve pdf-chat --inspect
   ```
   (Nx forwards `--inspect` to the underlying Node process, which listens on
   port `9229`.)
2. Create a **Run/Debug Configuration** → **Attach to Node.js/Chrome**.
3. Set **Host** to `localhost` and **Port** to `9229`, then start it.

WebStorm resolves sourcemaps from `dist/` automatically, so breakpoints in your
TypeScript sources will be hit.

## Further Information for coding agents

Project information for coding agents can be found in '.agents/AGENTS.md' file.
