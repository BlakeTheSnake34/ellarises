const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

//
// USER: register for an event
//
router.post('/events/:id/register', requireAuth, async (req, res) => {
  const eventId = req.params.id;
  const participantId = req.body.participant_id; // or map from currentUser later

  await knex('event_registrations').insert({
    participant_id: participantId,
    event_id: eventId
  });

  req.flash('success', 'You are registered for this event!');
  res.redirect('/events');
});

//
// MANAGER: see who registered for which event
//
router.get('/admin/registrations', requireManager, async (req, res) => {
  const rows = await knex('event_registrations as r')
    .leftJoin('participants as p', 'r.participant_id', 'p.id')
    .leftJoin('events as e', 'r.event_id', 'e.id')
    .select(
      'r.id',
      'r.registered_at',
      'p.first_name',
      'p.last_name',
      'p.email',
      'e.name as event_name',
      'e.event_date'
    )
    .orderBy('r.registered_at', 'desc');

  res.render('registrations/admin-list', {
    title: 'Event Registrations',
    registrations: rows
  });
});

module.exports = router;
