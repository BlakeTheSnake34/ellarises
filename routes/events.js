const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

// List events
router.get('/events', requireAuth, async (req, res) => {
  const events = await knex('events').select('*').orderBy('event_date', 'desc');
  res.render('events/list', { title: 'Events', events });
});

// New event form
router.get('/events/new', requireManager, (req, res) => {
  res.render('events/form', { title: 'New Event', event: {} });
});

// Create event
router.post('/events', requireManager, async (req, res) => {
  const { name, event_date, event_type, description } = req.body;
  await knex('events').insert({ name, event_date, event_type, description });

  req.flash('success', 'Event created');
  res.redirect('/events');
});

// Edit event form
router.get('/events/:id/edit', requireManager, async (req, res) => {
  const event = await knex('events').where({ id: req.params.id }).first();

  if (!event) {
    req.flash('error', 'Event not found');
    return res.redirect('/events');
  }

  res.render('events/form', { title: 'Edit Event', event });
});

// Update event
router.post('/events/:id', requireManager, async (req, res) => {
  const { name, event_date, event_type, description } = req.body;

  await knex('events')
    .where({ id: req.params.id })
    .update({ name, event_date, event_type, description });

  req.flash('success', 'Event updated');
  res.redirect('/events');
});

// Delete event
router.post('/events/:id/delete', requireManager, async (req, res) => {
  await knex('events').where({ id: req.params.id }).delete();
  req.flash('success', 'Event deleted');
  res.redirect('/events');
});

module.exports = router;
