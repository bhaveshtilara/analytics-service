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

app.get('/stats', async (req, res) => {
  const { site_id, date } = req.query;

  if (!site_id) {
    return res.status(400).json({ error: 'site_id query parameter is required' });
  }

  try {
    const queryParams = [site_id];
    let dateFilter = ''; 

    if (date) {
      queryParams.push(date);
      dateFilter = `AND DATE(timestamp) = $${queryParams.length}`;
    }

    
    const totalViewsQuery = `
      SELECT COUNT(*) AS total_views
      FROM analytics_events
      WHERE site_id = $1 AND event_type = 'page_view' ${dateFilter}
    `;

    const uniqueUsersQuery = `
      SELECT COUNT(DISTINCT user_id) AS unique_users
      FROM analytics_events
      WHERE site_id = $1 AND event_type = 'page_view' ${dateFilter}
    `;
    const topPathsQuery = `
      SELECT path, COUNT(*) AS views
      FROM analytics_events
      WHERE site_id = $1 AND event_type = 'page_view' ${dateFilter}
      GROUP BY path
      ORDER BY views DESC
      LIMIT 3
    `;

    const [viewsResult, usersResult, pathsResult] = await Promise.all([
      db.query(totalViewsQuery, queryParams),
      db.query(uniqueUsersQuery, queryParams),
      db.query(topPathsQuery, queryParams)
    ]);

    const response = {
      site_id: site_id,
      date: date || 'all-time', 
      total_views: parseInt(viewsResult.rows[0].total_views, 10),
      unique_users: parseInt(usersResult.rows[0].unique_users, 10),
      top_paths: pathsResult.rows, 
    };

    return res.status(200).json(response);

  } catch (err) {
    console.error('🔥 Failed to get stats:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
});