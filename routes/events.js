const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

// List events (from eventtemplates table)
router.get('/events', requireAuth, async (req, res) => {
  const events = await knex('eventtemplates')
    .select('*')
    .orderBy('eventname', 'asc');

  res.render('events/list', {
    title: 'Events',
    events,
    csrfToken: req.csrfToken(),   // for the delete form in list.ejs
    // currentUser comes from injectUser middleware (res.locals.currentUser)
  });
});

// New event form
router.get('/events/new', requireManager, (req, res) => {
  res.render('events/form', {
    title: 'New Event',
    event: {},              // empty object for a blank form
    csrfToken: req.csrfToken()
  });
});

// Create event
router.post('/events', requireManager, async (req, res) => {
  const {
    eventname,
    eventtype,
    eventdescription,
    eventrecurrencepattern,
    eventdefaultcapacity
  } = req.body;

  await knex('eventtemplates').insert({
    eventname,
    eventtype,
    eventdescription,
    eventrecurrencepattern,
    eventdefaultcapacity
  });

  req.flash('success', 'Event created');
  res.redirect('/events');
});

// Edit event form
router.get('/events/:eventName/edit', requireManager, async (req, res) => {
  const event = await knex('eventtemplates')
    .where({ eventname: req.params.eventName })
    .first();

  if (!event) {
    req.flash('error', 'Event not found');
    return res.redirect('/events');
  }

  res.render('events/form', {
    title: 'Edit Event',
    event,
    csrfToken: req.csrfToken()
  });
});

// Update event
router.post('/events/:eventName', requireManager, async (req, res) => {
  const {
    eventname,
    eventtype,
    eventdescription,
    eventrecurrencepattern,
    eventdefaultcapacity
  } = req.body;

  await knex('eventtemplates')
    .where({ eventname: req.params.eventName })
    .update({
      eventname,
      eventtype,
      eventdescription,
      eventrecurrencepattern,
      eventdefaultcapacity
    });

  req.flash('success', 'Event updated');
  res.redirect('/events');
});

// Delete event
router.post('/events/:eventName/delete', requireManager, async (req, res) => {
  await knex('eventtemplates')
    .where({ eventname: req.params.eventName })
    .delete();

  req.flash('success', 'Event deleted');
  res.redirect('/events');
});

module.exports = router;
