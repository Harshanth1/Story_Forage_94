# Architecture Note — StoryForge 94

## Skill Ownership

| Skill | Owner | Responsibilities |
|-------|-------|-----------------|
| **Design** | Designer | UI/UX system, dark glassmorphism theme, color palette, typography, micro-animations, component layout, responsive grid, empty/loading/error states, filter bar UX |
| **Gen-AI** | AI Engineer | Template NLG engine (narrator.js), weighted scoring algorithm (scorer.js), event correlation/clustering (correlator.js), narrative quality, priority matrix design |
| **Product Management** | PM | Event taxonomy (3 stream types × multiple event types), priority matrix thresholds, operator feedback loop design, demo script, user flow documentation, audit trail spec |

## Component Map

```
Backend (Gen-AI + PM)           Frontend (Design + PM)
─────────────────────           ──────────────────────
server.js                       App.jsx
  ├── routes/events.js            ├── Header.jsx        [Design]
  ├── routes/config.js            ├── StatsBar.jsx      [Design + PM]
  ├── engine/                     ├── NarrativeFeed.jsx [Design + Gen-AI]
  │   ├── scorer.js   [Gen-AI]    ├── EventDetail.jsx   [Design + PM]
  │   ├── narrator.js [Gen-AI]    ├── WeightAdjuster.jsx[Design + PM]
  │   └── correlator.js[Gen-AI]  ├── EmptyState.jsx    [Design]
  ├── store/                      ├── LoadingState.jsx  [Design]
  │   ├── eventStore.js[PM]       └── ErrorState.jsx    [Design]
  │   └── auditLog.js  [PM]     hooks/
  └── simulator/                  ├── useEventStream.js [Gen-AI]
      └── streams.js   [PM]       └── useWeights.js     [PM]
```

## Data Flow

```
Simulator → POST /api/events/ingest
         → scorer.scoreAndRank()       [Gen-AI]
         → correlator.annotate()       [Gen-AI]
         → narrator.narrateBatch()     [Gen-AI]
         → eventStore.addBatch()       [PM]
         → auditLog.write()            [PM]
         → SSE push to all clients     [Design]
         → NarrativeFeed re-renders    [Design]
```

## Design Decisions

1. **SSE over WebSockets**: Unidirectional server push is sufficient; SSE is HTTP-native, simpler, and auto-reconnects via browser EventSource API.

2. **Template NLG over LLM**: Zero external API dependency, deterministic output, sub-millisecond latency. Swappable to LLM if key available.

3. **In-memory + JSON persistence**: No database dependency. Sufficient for a 6-hour hackathon demo window. JSON file provides instant replay.

4. **Client-side filtering**: Priority/source filters applied in-browser without server roundtrip for instant response.

5. **Auto-balancing weight sliders**: When one weight is increased, others proportionally decrease to maintain sum=1.0, preventing operator errors.
