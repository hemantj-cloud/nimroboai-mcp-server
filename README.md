# Nimrobo MCP Server

> Model Context Protocol (MCP) server for **Nimrobo AI**, enabling AI assistants (ChatGPT, Claude Desktop, Cursor, NitroStudio, and autonomous AI agents) to query **Outcome Analytics** and securely dispatch **Outcome Experiment Runs** on macOS. Built with the **NitroStack TypeScript Framework (`@nitrostack/core`)**.

---

## 🌟 Capabilities & Features

### 📊 Phase 1: Outcome Analytics & User Profile (Cloud API)
* **`get_user_profile`**: Fetches the authenticated user profile, organization, and plan details (`GET /api/v1/user/profile`).
* **`get_outcomes`**: Lists available optimization outcomes, their IDs, targets, and statuses (`GET /api/v1/outcomes`).
* **`get_outcome_analytics`**: Retrieves detailed performance metrics, conversion lifts, and statistical significance (`GET /api/v1/outcomes/:id/analytics`).
* **`get_outcome_runs`**: Retrieves historical runs, tested variants, duration, and measured results (`GET /api/v1/outcomes/:id/runs`).
* **`get_run_status`**: Checks real-time execution status, step progression, and live diagnostic logs (`GET /api/v1/runs/:id`).

### 🚀 Phase 2: Local Outcome Run Dispatcher (macOS Execution Bridge)
* **`dispatch_outcome_run`**: Dispatches a new outcome experiment run to execute locally on the user's Mac (via local bridge/daemon) or cloud environment (`POST /api/v1/runs/dispatch`).

### 🔐 Built-in OAuth 2.0 PKCE Authentication
* **Client ID**: Configurable OAuth Public Client.
* **PKCE Method**: Hard-enforced **`S256`** (SHA-256 base64url challenge, min 43 characters, no plain fallback).
* **Scopes**: `user:read`.
* **Token Lifetime**: 30-day opaque Bearer tokens.
* **Direct Bearer Token Support**: Set `NIMROBO_ACCESS_TOKEN` for headless/CI workflows.
* **Offline Mock Mode**: Built-in mock fixture fallback (`NIMROBO_MOCK_MODE=true`) for sandbox development and testing without network dependencies.

---

## 📁 Project Structure

```
nimrobo-mcp/
├── src/
│   ├── index.ts                         # Bootstrap entry point
│   ├── app.module.ts                    # Root @McpApp application module
│   ├── config/
│   │   └── nimrobo.config.ts            # Environment & fail-fast config loader
│   ├── auth/
│   │   └── pkce.utils.ts                # PKCE S256 generator & RFC 7636 validator
│   ├── services/
│   │   ├── oauth.service.ts             # OAuth 2.0 PKCE flow & token manager
│   │   └── nimrobo-client.service.ts    # HTTP client for Nimrobo Cloud endpoints
│   ├── guards/
│   │   └── oauth.guard.ts               # NitroStack OAuthGuard
│   ├── health/
│   │   └── system.health.ts             # NitroStack system resource health check
│   ├── modules/
│   │   └── nimrobo/
│   │       ├── nimrobo.module.ts        # Main feature module
│   │       ├── outcome-analytics.tools.ts # Phase 1 MCP tools (@Tool)
│   │       ├── outcome-dispatcher.tools.ts# Phase 2 MCP tools (@Tool)
│   │       ├── nimrobo.prompts.ts       # MCP Prompts
│   │       ├── nimrobo.resources.ts     # MCP Resources (nimrobo://outcomes/catalog)
│   │       ├── dto/                     # Zod input & output schemas
│   │       └── mocks/                   # Mock fixtures for offline development
│   └── widgets/                         # UI widgets
├── tests/
│   ├── config.test.ts                   # Environment validation & fail-fast tests
│   ├── pkce.test.ts                     # PKCE S256 tests
│   ├── nimrobo-client.test.ts           # API client & mock tests
│   └── tools.test.ts                    # MCP Tools & prompt tests
├── package.json
├── tsconfig.json
└── .env.example
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` to configure your parameters:
```ini
NIMROBO_API_BASE_URL=https://your-nimrobo-domain.com
NIMROBO_CLIENT_ID=your_client_id
NIMROBO_AUTH_URL=https://your-nimrobo-domain.com/oauth/authorize
NIMROBO_TOKEN_URL=https://your-nimrobo-domain.com/api/oauth/token
NIMROBO_REDIRECT_URI=https://your-app-domain.com/oauth/callback
NIMROBO_SCOPE=user:read

# Fail-fast OAuth resource indicator & authorization server URLs
RESOURCE_URI=https://your-nimrobo-domain.com
AUTH_SERVER_URL=https://your-nimrobo-domain.com

# Optional direct token (if not using interactive OAuth)
# NIMROBO_ACCESS_TOKEN=your_token_here

# Enable offline mock mode for local development/testing
NIMROBO_MOCK_MODE=true
```

### 3. Run Tests
```bash
npm test
```

### 4. Build
```bash
npm run build
```

### 5. Start MCP Server
```bash
npm start
# or development with hot reload:
npm run dev
```

---

## 🔌 Connecting to MCP Clients

### Claude Desktop
Add to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "nimrobo": {
      "command": "node",
      "args": [
        "/path/to/nimrobo-mcp/dist/index.js"
      ],
      "env": {
        "NIMROBO_API_BASE_URL": "https://your-nimrobo-domain.com",
        "NIMROBO_CLIENT_ID": "your_client_id",
        "NIMROBO_AUTH_URL": "https://your-nimrobo-domain.com/oauth/authorize",
        "NIMROBO_TOKEN_URL": "https://your-nimrobo-domain.com/api/oauth/token",
        "NIMROBO_REDIRECT_URI": "https://your-app-domain.com/oauth/callback",
        "NIMROBO_SCOPE": "user:read",
        "RESOURCE_URI": "https://your-nimrobo-domain.com",
        "AUTH_SERVER_URL": "https://your-nimrobo-domain.com",
        "NIMROBO_MOCK_MODE": "true"
      }
    }
  }
}
```

### Cursor IDE
Add to `.cursor/mcp.json`:
```json
{
  "mcpServers": {
    "nimrobo": {
      "command": "node",
      "args": [
        "/path/to/nimrobo-mcp/dist/index.js"
      ]
    }
  }
}
```

### NitroStudio
Open [NitroStudio](https://nitrostack.ai/studio) and select the project directory to visually inspect tools, test requests, view widgets, and debug the OAuth authentication flow.

---

## 🛠️ MCP Tool Reference

| Tool Name | Key Parameters | Description |
| :--- | :--- | :--- |
| `get_user_profile` | _None_ | Fetches current user profile from `GET /api/v1/user/profile`. |
| `get_outcomes` | `status` (opt), `tag` (opt), `limit` (opt) | Lists active and historical outcomes with metadata and metrics. |
| `get_outcome_analytics` | `outcome_id` (req), `time_range` (`7d`\|`30d`\|`90d`\|`all`) | Returns conversion lifts, confidence intervals, and timeline datapoints. |
| `get_outcome_runs` | `outcome_id` (opt), `status` (opt), `limit` (opt) | Lists historical execution runs, hypotheses tested, and duration. |
| `get_run_status` | `run_id` (req), `include_logs` (bool) | Checks real-time execution step progression and diagnostic logs. |
| `dispatch_outcome_run` | `outcome_id` (req), `hypothesis` (opt), `target_environment` (`local_mac`\|`cloud`), `dry_run` (bool) | Dispatches an outcome experiment run on Mac or cloud. |

---

## 📜 License
Apache-2.0
