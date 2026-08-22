// engine/correlator.js — Groups related events into clusters to reduce noise
// and enrich scoring context.

/**
 * Given a batch of events (already scored), finds clusters of related events
 * based on: same source, same service, within a time window.
 *
 * Returns { eventId -> clusterInfo } map.
 */
function correlate(events, windowMs = 15 * 60 * 1000) {
  const clusters = {}; // key -> { eventIds, count, source, service, type }

  for (const event of events) {
    const ts = new Date(event.timestamp).getTime();
    const key = `${event.source}::${event.service}::${event.type}`;

    if (!clusters[key]) {
      clusters[key] = {
        id: key,
        source: event.source,
        service: event.service,
        type: event.type,
        eventIds: [],
        count: 0,
        firstSeen: ts,
        lastSeen: ts
      };
    }

    const cluster = clusters[key];
    // Only include if within the time window from cluster start
    if (ts - cluster.firstSeen <= windowMs) {
      cluster.eventIds.push(event.id);
      cluster.count++;
      cluster.lastSeen = Math.max(cluster.lastSeen, ts);
    }
  }

  // Build reverse lookup: eventId -> cluster
  const eventClusterMap = {};
  for (const cluster of Object.values(clusters)) {
    for (const eventId of cluster.eventIds) {
      eventClusterMap[eventId] = {
        clusterId: cluster.id,
        clusterSize: cluster.count,
        relatedEvents: cluster.eventIds.filter(id => id !== eventId).slice(0, 5),
        source: cluster.source
      };
    }
  }

  return eventClusterMap;
}

/**
 * Annotate a batch of events with correlation context.
 */
function annotate(events) {
  const clusterMap = correlate(events);
  return events.map(event => ({
    ...event,
    correlation: clusterMap[event.id] || { clusterSize: 1, relatedEvents: [] }
  }));
}

module.exports = { correlate, annotate };
