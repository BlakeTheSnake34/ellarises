// routes/dashboard.js
const express = require('express');
const router = express.Router();
const { requireManager } = require('../middleware/auth');

// Manager-only dashboard
router.get('/dashboard', requireManager, (req, res) => {
  res.render('dashboard/index', {
    title: 'Dashboard'
  });
});

module.exports = router;

