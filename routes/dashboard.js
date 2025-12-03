// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Simple dashboard route
router.get('/dashboard', requireAuth, (req, res) => {
  // If you already have a dashboard view, change this render to your file
  // For now this just sends a basic page to avoid template errors
  res.render('dashboard/index', {
    title: 'Dashboard'
  });
});

module.exports = router;
