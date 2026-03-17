# MCP Server — Reference Guide

A framework-agnostic reference for building MCP (Model Context Protocol) servers that integrate cleanly with Claude and other AI agents.

---

## 1. What is MCP?

MCP is an open protocol that lets AI agents (like Claude) discover and call tools exposed by external servers. Instead of hardcoding API calls into a model's context, you expose a standardized server that any MCP-compatible client can connect to, discover tools from, and invoke.

**The key benefit:** agents can automatically find the right tool for a task — without the user explicitly naming which service to call — as long as the server is described well.

---

## 2. Core Concepts

### Server Identity
Every MCP server declares:
- `name` — a short identifier (e.g. `"atv"`, `"github"`)
- `version` — semantic version string
- `instructions` *(optional but critical)* — tells the agent when to use this server

### Tools
The primary primitive. Each tool has:
| Field | Purpose |
|---|---|
| `name` | Unique identifier within the server (e.g. `list_vaults`) |
| `description` | Plain-English explanation of what the tool does and **when to use it** |
| `inputSchema` | JSON Schema (or Zod) defining accepted parameters |
| `handler` | The function that executes when the tool is called |

### Resources *(optional)*
Static or dynamic data the server exposes for reading (e.g. files, documents). Less commonly used than tools.

### Prompts *(optional)*
Pre-defined prompt templates the server exposes. Become slash commands in Claude Code (e.g. `/mcp__servername__promptname`).

### Transport
How the client and server communicate:
- **stdio** — server runs as a subprocess; communication over stdin/stdout
- **HTTP / Streamable HTTP (SSE)** — server runs as a network service; communication over HTTP

---

## 3. The Auto-Selection Problem

By default, agents don't know which MCP server to use unless the user tells them. You solve this in two places:

### 3a. Server-level `instructions`
Set an `instructions` string when creating your server. This string is returned during the MCP `initialize` handshake and injected into the agent's system context under `# MCP Server Instructions`.

```
// Pseudocode — works in any MCP SDK
server = McpServer({
  name: "my-service",
  version: "1.0.0",
  instructions: `You are connected to the My Service MCP server.

ALWAYS use this server when the user asks about:
- [topic 1]
- [topic 2]
- [any related keywords]

Available tools:
- tool_one — short description
- tool_two — short description`
})
```

**Pattern:** Lead with `ALWAYS use this server when...` — this phrasing reliably triggers automatic tool discovery.

### 3b. Tool `description` field
The description is what Claude reads to decide whether to call a specific tool. Write it as:

> "Do X. Use this when the user wants to Y or Z."

Not just: "Does X."

---

## 4. Writing Good Tool Descriptions

| Aspect | Bad | Good |
|---|---|---|
| What it does | "Returns vault data" | "Returns vault metadata including address, chain, and supported tokens" |
| When to use | *(missing)* | "Use when discovering available vaults or checking which chains are supported" |
| Parameters | `address: string` | `address: string — EVM contract address of the vault (0x...)` |
| Return shape | *(missing)* | "Returns an ordered array of transactions that must be sent in sequence" |

**Rule:** If a human can't tell from the description alone whether to call this tool for a given task, Claude can't either.

---

## 5. Transport Choices

### stdio
```json
// .mcp.json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["path/to/server.js"],
      "env": { "API_KEY": "..." }
    }
  }
}
```
- Server is spawned as a child process
- Good for: local tools, CLI utilities, tools with filesystem access
- Auth via environment variables
- No network exposure

### HTTP / Streamable HTTP
```json
// .mcp.json
{
  "mcpServers": {
    "my-server": {
      "url": "https://my-service.example.com/mcp",
      "headers": {
        "x-api-key": "user-key-here"
      }
    }
  }
}
```
- Server runs as a network service
- Good for: multi-user APIs, deployed services, shared infrastructure
- Auth via request headers
- Can be used from any machine

### mcp-remote proxy (fallback)
Use `npx mcp-remote <url>` when:
- The MCP client doesn't natively support HTTP (older versions)
- You need to bridge a remote HTTPS server through stdio locally

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "https://my-service.example.com/mcp",
               "--header", "x-api-key:my-key"]
    }
  }
}
```

### Stateless vs Stateful
- **Stateless** (recommended for HTTP): each request is independent; set `sessionIdGenerator: undefined`. Easier to scale and deploy.
- **Stateful**: server maintains session state between calls. Useful for multi-step workflows but requires sticky routing.

---

## 6. Auth Patterns

Auth belongs at the **transport layer** — before any MCP logic runs.

| Transport | Auth mechanism |
|---|---|
| HTTP | Request header (e.g. `x-api-key`, `Authorization: Bearer`) |
| stdio | Environment variables passed via `env` in `.mcp.json` |

**For HTTP servers:** apply auth middleware before the MCP route handler. The MCP handler itself should be auth-agnostic.

```
Request → [Auth middleware] → [Rate limit middleware] → [MCP handler]
```

Never put credentials in the URL — they appear in logs. Use headers or env vars exclusively.

---

## 7. `.mcp.json` Configuration

The `.mcp.json` file (committed to the repo root) tells MCP clients how to connect.

### Native HTTP format
```json
{
  "mcpServers": {
    "server-name": {
      "url": "https://api.example.com/mcp",
      "headers": {
        "x-api-key": "placeholder-replace-with-your-key"
      }
    }
  }
}
```

### stdio format
```json
{
  "mcpServers": {
    "server-name": {
      "command": "node",
      "args": ["dist/server.js"],
      "env": {
        "DATABASE_URL": "..."
      }
    }
  }
}
```

### Important notes
- The **key name** (e.g. `"server-name"`) is used as the server's display label in Claude Code. Its first character becomes the icon shown during tool execution (e.g. `"atv"` → shows **A**).
- For local dev, use `http://localhost:PORT/mcp`. Update to the production URL before shipping.
- Don't commit real API keys — use placeholder values and document that integrators must substitute their own.

---

## 8. TypeScript-Specific Gotchas

### TS2589 — Zod generic depth limit
When using Zod schemas in MCP tool definitions, TypeScript may hit its type instantiation depth limit:
```
error TS2589: Type instantiation is excessively deep and possibly infinite.
```
**Fix:** Add `// @ts-nocheck` at the top of the MCP routes file. The runtime behavior is unaffected; only type checking in that file is skipped.

### TS2742 — Inferred type not portable (pnpm)
When exporting a router/handler from a file, pnpm's nested node_modules layout can cause:
```
error TS2742: The inferred type of 'X' cannot be named without a reference to
'.pnpm/@types+express-serve-static-core@.../...'
```
**Fix:** Add an explicit type annotation to the exported value:
```typescript
// Before
export const myRouter = Router();

// After
import { Router, type IRouter } from "express";
export const myRouter: IRouter = Router();
```

---

## 9. Dependency & Build Hygiene

### Always commit the lockfile
After adding `@modelcontextprotocol/sdk` (or any new dependency):
```bash
pnpm install   # or npm install / yarn
git add pnpm-lock.yaml   # (or package-lock.json / yarn.lock)
git commit -m "chore: update lockfile for mcp sdk"
```

CI environments use `--frozen-lockfile` by default. If your lockfile doesn't match `package.json`, the build will fail with:
```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile"
```

This is easy to miss when adding packages locally without pushing the lockfile.

---

## 10. Deployment Checklist

Before going to production:

- [ ] `instructions` field is set on the server with "ALWAYS use when..." trigger phrases
- [ ] Every tool has a description that includes **when to use** context
- [ ] Every tool parameter has a `description` in the schema
- [ ] Auth middleware is applied before the MCP route handler
- [ ] `.mcp.json` URL updated from `localhost` to production domain
- [ ] Lockfile committed and up to date
- [ ] Placeholder API key documented in `.mcp.json` (not a real key)
- [ ] Server is stateless (or stateful session routing is configured)
- [ ] TypeScript build passes (`tsc --noEmit` or equivalent)

---

## 11. Claude Code UI Behaviour

| Element | How it works |
|---|---|
| Server icon | First character of the `.mcp.json` key name (e.g. `"atv"` → **A**) |
| Tool icon | Wrench — built-in, not configurable |
| Search icon | Magnifying glass — appears during tool discovery phase |
| "MCP Server Instructions" header | Populated from the `instructions` field on your `McpServer` |
| Auto-selection | Claude reads `instructions` + tool `description` fields to decide when to invoke tools without user prompting |

Custom icons (images, emoji in headers) are not supported by the Claude Code UI — the letter initial is the only customization available.

---

## Quick Reference

```
McpServer
├── name          → display + icon initial
├── version       → semantic version
├── instructions  → injected into agent context → drives auto-selection
└── tools[]
    ├── name        → unique identifier
    ├── description → "does X. Use when user asks about Y" → drives tool selection
    ├── inputSchema → Zod / JSON Schema → validated before handler runs
    └── handler     → async fn({ ...params }) → return { content: [...] }
```

```
.mcp.json
├── HTTP server  → { url, headers }
└── stdio server → { command, args, env }
```
