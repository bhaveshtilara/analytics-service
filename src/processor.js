const redis = require('./queue');
const db = require('./db');

const EVENT_QUEUE_KEY = 'event_queue'; 
const BATCH_SIZE = 10; 
const BATCH_TIMEOUT = 5; 

async function processEventQueue() {
  console.log('🔄 Processor started, waiting for events...');

  while (true) {
    try {
      const reply = await redis.brpop(EVENT_QUEUE_KEY, BATCH_TIMEOUT);

      if (reply) {
        const [key, eventString] = reply;
        const event = JSON.parse(eventString);

        await db.query(
          `INSERT INTO analytics_events (site_id, event_type, path, user_id, timestamp)
           VALUES ($1, $2, $3, $4, $5)`,
          [
            event.site_id,
            event.event_type,
            event.path,
            event.user_id,
            event.timestamp,
          ]
        );

        console.log(`✅ Processed event for site: ${event.site_id}`);
      }
    } catch (err) {
      console.error('🔥 Error processing event:', err);
    }
  }
}

processEventQueue();