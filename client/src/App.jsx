// App.jsx — Root component
import React, { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import StatsBar from './components/StatsBar.jsx';
import NarrativeFeed from './components/NarrativeFeed.jsx';
import EventDetail from './components/EventDetail.jsx';
import WeightAdjuster from './components/WeightAdjuster.jsx';
import ErrorState from './components/ErrorState.jsx';
import { useEventStream } from './hooks/useEventStream.js';

export default function App() {
  const { events, stats, status, newEventCount, clearNewCount, retry } = useEventStream();
  const [selectedEvent, setSelectedEvent] = useState(null);

  const handleSelect = useCallback((event) => {
    setSelectedEvent(prev => prev?.id === event.id ? null : event);
  }, []);

  const handleClose = useCallback(() => setSelectedEvent(null), []);

  return (
    <div className="app-layout">
      <Header status={status} totalCount={stats.total || 0} />

      <StatsBar stats={stats} />

      <main className="main-content">
        {/* Left: narrative feed */}
        {status === 'disconnected' ? (
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ErrorState
              message="Lost connection to the event stream. Make sure the server is running on port 3001."
              onRetry={retry}
            />
          </div>
        ) : (
          <NarrativeFeed
            events={events}
            status={status}
            selectedId={selectedEvent?.id}
            onSelect={handleSelect}
            onRetry={retry}
          />
        )}

        {/* Right sidebar */}
        <div className="sidebar">
          <EventDetail event={selectedEvent} onClose={handleClose} />
          <WeightAdjuster />
        </div>
      </main>

      {/* New events toast */}
      {newEventCount > 0 && (
        <button className="new-event-toast" onClick={() => { clearNewCount(); }}>
          ↑ {newEventCount} new event{newEventCount > 1 ? 's' : ''} — scroll to top
        </button>
      )}
    </div>
  );
}
