const express = require('express');
const redis = require('./queue'); 
const db = require('./db');

const app = express();
const PORT = 8080;

app.use(express.json());

const EVENT_QUEUE_KEY = 'event_queue'; 
app.post('/event', async (req, res) => {
  const event = req.body;

  if (!event.site_id || !event.event_type) {
    return res.status(400).json({ error: 'site_id and event_type are required' });
  }

  try {
    await redis.lpush(EVENT_QUEUE_KEY, JSON.stringify(event));

    return res.status(202).json({ status: 'queued' });

  } catch (err) {
    console.error('🔥 Failed to queue event:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});