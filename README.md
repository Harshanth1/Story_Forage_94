# StoryForge 94 — Product Narrative Studio

> AI-powered event triage that replaces rules-based noise with prioritized, human-readable narratives for SaaS operators.

## Quick Start

```bash
# 1. Install all dependencies
cd e:\Story_Forage94
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 2. Start everything (backend + frontend + simulator)
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **SSE Stream**: http://localhost:3001/api/events/stream
- **Health Check**: http://localhost:3001/api/health

---

## Architecture

```
3 Event Streams (Simulated)
    ↓ POST JSON
Express Backend (port 3001)
    → Scorer  (weighted multi-dim ranking)
    → Narrator (template NLG)
    → Correlator (cluster detection)
    → EventStore (memory + JSON persistence)
    → AuditLog (JSONL append-only)
    ↓ SSE push
React Dashboard (port 5173)
    → Narrative Feed (ranked cards)
    → Event Detail (score breakdown + audit trail)
    → Weight Adjuster (operator feedback loop)
```

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/events/ingest` | Ingest event batch (JSON array) |
| `GET`  | `/api/events/stream` | SSE real-time stream |
| `GET`  | `/api/events/history` | Last N ranked events |
| `GET`  | `/api/events/:id` | Single event + audit trail |
| `GET`  | `/api/config/weights` | Current scoring weights |
| `PUT`  | `/api/config/weights` | Update weights (operator feedback) |
| `POST` | `/api/config/reset` | Reset weights to defaults |
| `GET`  | `/api/health` | Server health check |

### Ingest example

```bash
curl -X POST http://localhost:3001/api/events/ingest \
  -H "Content-Type: application/json" \
  -d '[{
    "source": "infrastructure",
    "type": "cpu_spike",
    "severity": 5,
    "region": "us-east-1",
    "service": "auth-service",
    "userImpact": 45000,
    "metadata": { "cpu_percent": 97 }
  }]'
```

### Update weights

```bash
curl -X PUT http://localhost:3001/api/config/weights \
  -H "Content-Type: application/json" \
  -d '{ "severity": 0.50, "impact": 0.25, "recency": 0.15, "frequency": 0.10 }'
```

## Scoring Algorithm

```
Score = (severity × W_sev) + (userImpact × W_imp) + (recency × W_rec) + (frequency × W_freq)
```

Default weights: `severity: 0.35 | impact: 0.30 | recency: 0.20 | frequency: 0.15`

| Priority | Score Range |
|----------|-------------|
| P1 🔴    | ≥ 0.80      |
| P2 🟠    | ≥ 0.60      |
| P3 🟡    | ≥ 0.35      |
| P4 🟢    | < 0.35      |

## Event Stream Sources

| Stream | Types | Cadence |
|--------|-------|---------|
| Infrastructure | cpu_spike, memory_pressure, latency_spike, network_error, disk_warning, service_down | 4–8s |
| Product/Deploy | deployment, rollback, feature_flag, config_change | 12–20s |
| User Behavior | error_rate_spike, login_failure, cart_abandonment, support_ticket_burst, session_drop | 5–12s |

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| Server port | `3001` | Set `PORT` env var |
| Max stored events | `1000` | In eventStore.js |
| SSE heartbeat | `15s` | Keep-alive interval |
| Simulator initial burst | `8 events` | On startup |
| Persistence file | `server/data/events.json` | Auto-created |
| Audit log | `server/data/audit.jsonl` | Append-only |

## Requirements

- Node.js 18+ (for `--watch` mode)
- npm 9+
- No external API keys needed

## Team Size

3 members. See [ARCHITECTURE.md](./ARCHITECTURE.md) for skill ownership.
