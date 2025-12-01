// routes/public.js
const express = require('express');
const router = express.Router();

// Public landing page for donors and supporters
router.get('/', (req, res) => {
  res.render('public/landing', {
    title: 'Ella Rises'
  });
});

module.exports = router;
