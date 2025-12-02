const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');

// Simple home screen for logged in users
router.get('/home', requireAuth, (req, res) => {
  res.render('home/index', { title: 'Home' });
});

module.exports = router;
