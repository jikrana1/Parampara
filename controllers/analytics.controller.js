const store = require('../data/store');

const INTERACTION_EVENTS = new Set([
  'click',
  'button_click',
  'item_view',
  'search',
]);

const isPlainObject = (value) => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const getInteractionValue = (data) => {
  if (!isPlainObject(data)) return null;

  const candidates = [data.action, data.label, data.itemId, data.query];

  for (const value of candidates) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }

    if (typeof value === 'number') {
      return String(value);
    }
  }

  return null;
};

/**
 * Handle incoming batch of anonymous telemetry events
 */
const receiveAnalytics = (req, res, next) => {
  try {
    const { events } = req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ error: 'Invalid payload format.' });
    }

    const { analytics } = store;
    let processedCount = 0;

    events.forEach((evt) => {
      if (!isPlainObject(evt)) {
        return;
      }

      if (typeof evt.event !== 'string' || !evt.event.trim()) {
        return;
      }

      const eventType = evt.event.trim();

      // Validate page_view events
      if (eventType === 'page_view') {
        if (typeof evt.path !== 'string' || !evt.path.trim()) {
          return;
        }

        const sanitizedEvent = {
          event: eventType,
          path: evt.path.trim(),
        };

        if (analytics.events.length >= 1000) {
          analytics.events.shift();
        }

        analytics.events.push(sanitizedEvent);
        analytics.pageViews[sanitizedEvent.path] =
          (analytics.pageViews[sanitizedEvent.path] || 0) + 1;

        processedCount += 1;
        return;
      }

      // Validate supported interaction events
      if (INTERACTION_EVENTS.has(eventType)) {
        const interactionValue = getInteractionValue(evt.data);

        if (!interactionValue) {
          return;
        }

        const sanitizedEvent = {
          event: eventType,
          data: {
            value: interactionValue,
          },
        };

        if (analytics.events.length >= 1000) {
          analytics.events.shift();
        }

        analytics.events.push(sanitizedEvent);

        const key = `${eventType}:${interactionValue}`;
        analytics.interactions[key] = (analytics.interactions[key] || 0) + 1;

        processedCount += 1;
      }
    });

    // sendBeacon ignores responses, but fetch might care
    res.status(202).json({
      success: true,
      received: events.length,
      processed: processedCount,
    });
  } catch (err) {
    console.error('[Telemetry] Error processing analytics payload:', err);
    res.status(500).json({ success: false });
  }
};

/**
 * Endpoint to retrieve aggregated analytics data (for an admin dashboard)
 */
const getAnalyticsStats = (req, res, next) => {
  try {
    const { analytics } = store;
    res.json({
      pageViews: analytics.pageViews,
      interactions: analytics.interactions,
      recentEvents: analytics.events.length,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  receiveAnalytics,
  getAnalyticsStats,
};