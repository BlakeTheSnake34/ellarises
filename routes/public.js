// routes/public.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');

// Public landing page for donors and supporters
router.get('/', async (req, res) => {
  let participants = 0;
  let events = 0;
  let donations = 0;

  try {
    // participants count
    const participantsRow = await knex('participants')
      .count('* as c')
      .first();
    participants = Number(participantsRow?.c || 0);
  } catch (err) {
    console.error('participants query error:', err.message);
  }

  try {
    // events count from eventoccurrences table
    const eventsRow = await knex('eventoccurrences')
      .count('* as c')
      .first();
    events = Number(eventsRow?.c || 0);
  } catch (err) {
    console.error('eventoccurrences query error:', err.message);
  }

  try {
    // total donations from donationamount column
    const donationsRow = await knex('donations')
      .sum('donationamount as s')
      .first();
    donations = Number(donationsRow?.s || 0);
  } catch (err) {
    console.error('donations query error:', err.message);
  }

  console.log('Landing stats resolved:', {
    participants,
    events,
    donations
  });

  res.render('public/landing', {
    title: 'Ella Rises',
    stats: {
      participants,
      events,
      donations
    }
  });
});

module.exports = router;




