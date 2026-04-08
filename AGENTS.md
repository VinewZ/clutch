# AGENTS.md - Clutch Development Guide

## Build Commands

```bash
# Development (hot reload)
wails3 dev

# Production build
task build        # or: wails3 build

# Run built binary
./bin/clutch

# Start in server mode (hidden, socket listener)
./bin/clutch --server

# Toggle window visibility (from another terminal)
./bin/clutch --toggle
```

## Architecture

```
cmd/clutch/main.go       # Entry point, wires services
internal/
├── socket/socket.go     # Unix socket for IPC (generic)
└── apps/
    ├── app.go           # AppController (Show/Hide/Toggle)
    ├── service.go      # DesktopApps (GetAll, Launch)
    ├── desktop.go      # App model
    └── icon.go         # IconIndex
frontend/
├── src/routes/index.tsx  # Main UI
├── bindings/             # Generated TypeScript bindings
└── package.json
```

## Key Patterns

- **Two services**: `DesktopApps` (app discovery) + `AppController` (window control)
- **Socket IPC**: Uses Unix socket at `/run/user/<uid>/clutch.sock` (or `/tmp/clutch.sock`)
- **TanStack Query**: `refetchOnWindowFocus: true` auto-refreshes app list on show

## Important Files

- `build/Taskfile.yml` - Common build tasks (bindings, frontend)
- `build/linux/Taskfile.yml` - Linux-specific tasks
- `build/config.yml` - Wails configuration
- `frontend/src/main.tsx` - React entry with QueryClientProvider

## Common Tasks

```bash
# Lint frontend
cd frontend && pnpm biome check --write .
```

## Gotchas

- **Never run `wails3 dev` directly** - it hangs indefinitely. Always use: `timeout <seconds> wails3 dev`
- Wails bindings generated with `-ts` flag produce `.ts` files (requires sed fix)
- Socket uses `bufio.Reader` with `ReadString('\n')` - commands must end with newline
- AppController and DesktopApps both registered as Wails services