const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');


// =========================================================
// USER — Register for an event
// =========================================================
router.post('/events/register', requireAuth, async (req, res) => {
  const { eventname, eventdatetimestart } = req.body;

  try {
    await knex('registrations').insert({
      participantemail: req.session.user.email,
      eventname: eventname,
      eventdatetimestart: eventdatetimestart,
      registrationstatus: 'Registered',
      registrationcreatedat: knex.fn.now()
    });

    req.flash('success', 'You are registered for this event!');
    res.redirect('/events');

  } catch (err) {
    console.error("REGISTRATION ERROR:", err);
    req.flash('error', 'Could not register for event.');
    res.redirect('/events');
  }
});


// =========================================================
// MANAGER — View all registrations
// =========================================================
router.get('/admin/registrations', requireManager, async (req, res) => {
  try {
    const rows = await knex('registrations as r')
      .leftJoin('participants as p', 'r.participantemail', 'p.participantemail')
      .leftJoin('eventoccurances as e', function () {
        this.on('r.eventname', '=', 'e.eventname')
            .andOn('r.eventdatetimestart', '=', 'e.eventdatetimestart');
      })
      .select(
        'r.participantemail',
        'p.participantfirstname',
        'p.participantlastname',

        'r.eventname',
        'r.eventdatetimestart',
        'e.eventdatetimeend',
        'e.eventlocation',

        'r.registrationstatus',
        'r.registrationattendedflag',
        'r.registrationcheckintime',
        'r.registrationcreatedat'
      )
      .orderBy('r.registrationcreatedat', 'desc');

    res.render('registrations/admin-list', {
      title: 'Event Registrations',
      registrations: rows
    });

  } catch (err) {
    console.error("ADMIN REGISTRATION ERROR:", err);
    req.flash('error', 'Could not load registrations.');
    res.redirect('/');
  }
});


module.exports = router;
