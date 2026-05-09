require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDB } = require('./db');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Intranet API running' });
});

// Routes
app.use('/api', routes);

// Start
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to init DB:', err);
    process.exit(1);
  });
