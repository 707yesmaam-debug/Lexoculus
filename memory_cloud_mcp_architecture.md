# Memory: Cloud MCP Architecture

## Date: 2026-03-04

## What was built
Converted LexOculus MCP from a local-only `npm run mcp` command into a secure, cloud-based SaaS MCP architecture.

## Key Components
1. **Prisma**: `McpApiKey` model added to schema (pushed via `db push`, not migrate)
2. **API Key Library**: `src/lib/mcp/api-keys.ts` — generate/validate/revoke/list, `lx_` prefix, SHA-256 hashed storage
3. **API Key Route**: `src/app/api/mcp/keys/route.ts` — GET/POST/DELETE, Supabase auth protected, max 5 keys
4. **Cloud Relay**: `src/app/api/mcp/invoke/route.ts` — Bearer auth, dispatches 6 tools + 3 resources
5. **NPM Client**: `packages/mcp-client/` — `@lexoculus/mcp-client`, stdio-to-HTTPS proxy
6. **UI**: `src/app/dashboard/configure-mcp/page.tsx` — API key management, config snippets, connection test
7. **Sidebar**: `08_CONFIGURE_MCP` added to dashboard layout

## Architecture Flow
```
IDE → @lexoculus/mcp-client (npx) → POST /api/mcp/invoke (Bearer lx_...) → compliance engine → response
```

## Remaining
- Create `@lexoculus` NPM org on npmjs.com
- Run `npm publish` in `packages/mcp-client/`
- MCP calls are currently unlimited (no scan credit deduction)

## Important Notes
- `prisma migrate dev` fails against production Supabase DB — use `prisma db push` instead
- Key format: `lx_<64 hex chars>`, only first 11 chars (`lx_XXXXXXXX`) stored as prefix for display
- The old local MCP server at `mcp-server/` still exists but is not used by customers
