require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDB, ensureAnalyticsMenu } = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../public')));

// API Routes
app.use('/api', routes);

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});

// Start
initDB()
  .then(async () => {
    // Ensure Analytics menu exists (for backwards compatibility)
    await ensureAnalyticsMenu();

    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Frontend: http://localhost:${PORT}`);
      console.log(`✓ API: http://localhost:${PORT}/api`);
    });
  })
  .catch(err => {
    console.error('Failed to init DB:', err);
    process.exit(1);
  });
