# AGENTS.md - Clutch Development Guide

## Build Commands

```bash
# Development (hot reload)
task dev

# Production build
task build

# Run built binary
./bin/clutch

# Start in server mode (hidden, socket listener)
./bin/clutch --server

# Toggle window visibility (from another terminal)
./bin/clutch --toggle
```

## Architecture

### Go Backend (Wails)
- `cmd/clutch/main.go` - Entry point, wires services
- `internal/socket/` - Unix socket for IPC (generic)
- `internal/apps/` - App discovery and window control services

### React Frontend
- `frontend/src/routes/` - Main UI components
- `frontend/bindings/` - Generated TypeScript bindings from Wails

### Extension Runtime (packages/ext-runtime)
- `src/reconciler/` - React reconciler that outputs JSON instead of DOM
- `src/runtime/` - Extension loader and manager
- `src/socket/` - Socket client for IPC with Go backend
- `src/index.ts` - Module rewrite system (REWRITE_MAP)

### Raycast API Shim (packages/api)
- `src/components/list.ts` - List component hierarchy
- `src/utils.ts` - Component factory helpers
- `src/index.ts` - Exports `clutch.api` namespace

## Key Patterns

### Module Rewrite System
The ext-runtime intercepts `require()` calls to replace Raycast imports:
- `@raycast/api` → `clutch.api` (our implementation)
- `react` → Shared React instance
- `react/jsx-runtime` → Same React instance

**Important**: `@raycast/utils` is **already bundled inline** in extension JS files - no separate implementation needed.

### React Reconciler
Uses `react-reconciler` with a minimal HostConfig (~80 lines) that outputs JSON:
- `createInstance` → Creates JSONNode with type, props, children
- `appendInitialChild` → Pushes to parent's children array
- `updateContainerSync` → Synchronous render (async hooks return null initially)

### Extension Loading Flow
1. Go spawns Node.js subprocess with `cli.cjs`
2. CLI connects via Unix socket
3. Module rewrite intercepts `@raycast/api` imports
4. Reconciler renders React component to JSON
5. JSON sent to Go via socket, forwarded to frontend

## Extension Development

### Installed Extensions Location
Extensions are stored in `~/.local/share/clutch/extensions/<name>/`:
- Each extension has one or more `<command>.js` bundle files
- Bundles are fully self-contained (includes `@raycast/utils` inlined)
- Registry file: `registry.json`

### Creating Test Extensions
Test extensions should use CommonJS format:
```javascript
(function() {
  const React = require('react');
  const { List } = require('@raycast/api');

  function TestExtension() {
    return React.createElement(List, null,
      React.createElement(List.Item, { title: "Hello" })
    );
  }

  module.exports = TestExtension;
  module.exports.default = TestExtension;
})();
```

### Required Components for Extensions
Check `packages/api/src/components/` for implemented components. Missing components cause runtime errors. Common needed:
- `List`, `List.Item`, `List.Section`, `List.EmptyView`
- `Action`, `ActionPanel`
- `Icon`, `Keyboard`
- `showToast`, `Toast`

## Common Tasks

```bash
# Lint frontend
cd frontend && pnpm biome check --write .

# Rebuild ext-runtime bundle (after changes)
cd packages/ext-runtime && pnpm build
# Then copy: cp dist/cli.cjs ../../internal/runtime/cli.cjs

# Run with specific extension for testing
task dev
```

## Gotchas

- **Wails bindings**: Generated with `-ts` flag produce `.ts` files
- **Socket protocol**: Uses `bufio.Reader` with `ReadString('\n')` - commands must end with newline
- **Children prop**: Must be excluded when creating instances to avoid circular JSON references
- **Async rendering**: `usePromise`/`useCachedPromise` returns `{ data: null, isLoading: true }` on first render - need re-render mechanism
- **Multiple React instances**: Was a red herring - real issue was incomplete HostConfig
- **Bundle must be copied**: After building ext-runtime, copy `cli.cjs` to `internal/runtime/cli.cjs` for Go to embed it