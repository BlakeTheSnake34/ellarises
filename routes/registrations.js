const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

/* ============================================================
   USER — VIEW UPCOMING EVENTS
============================================================ */
router.get('/', requireAuth, async (req, res) => {
  try {
    const events = await knex('eventoccurrences')
      .select(
        'eventname',
        'eventdatetimestart',
        'eventdatetimeend',
        'eventlocation',
        'eventcapacity',
        'eventregistrationdeadline'
      )
      .where('eventdatetimestart', '>', new Date())
      .orderBy('eventdatetimestart', 'asc');

    res.render('registrations/list', {
      title: 'Upcoming Events',
      events
    });

  } catch (err) {
    console.error("ERROR loading events:", err);
    req.flash('error', 'Could not load events.');
    res.redirect('/');
  }
});

/* ============================================================
   USER — REGISTER FOR AN EVENT
============================================================ */
router.post('/:eventname/:eventdatetimestart', requireAuth, async (req, res) => {
  try {
    const { eventname, eventdatetimestart } = req.params;
    const participantemail = req.session.user.email;

    // Prevent duplicate registration
    const exists = await knex('registrations')
      .where({
        participantemail,
        eventname,
        eventdatetimestart
      })
      .first();

    if (exists) {
      req.flash('error', 'You are already registered for this event.');
      return res.redirect('/registrations');
    }

    // Insert registration
    await knex('registrations').insert({
      participantemail,
      eventname,
      eventdatetimestart,
      registrationstatus: 'Registered',
      registrationattendedflag: false,
      registrationcheckintime: null,
      registrationcreatedat: new Date()
    });

    req.flash('success', 'Successfully registered!');
    res.redirect('/registrations');

  } catch (err) {
    console.error("REGISTRATION ERROR:", err);

    // Common foreign key mis-match error explanation
    if (String(err).includes("violates foreign key constraint")) {
      req.flash(
        'error',
        'Registration failed: This event does not exist or you used an invalid timestamp. Make sure the event was created correctly.'
      );
    } else {
      req.flash('error', 'Could not register for this event.');
    }

    res.redirect('/registrations');
  }
});

/* ============================================================
   MANAGER — VIEW ALL REGISTRATIONS
============================================================ */
router.get('/manage', requireManager, async (req, res) => {
  try {
    const regs = await knex('registrations as r')
      .leftJoin('participants as p', 'r.participantemail', 'p.participantemail')
      .select(
        'r.*',
        'p.participantfirstname',
        'p.participantlastname'
      )
      .orderBy('eventdatetimestart', 'asc');

    res.render('registrations/manage', {
      title: 'Manage Registrations',
      regs
    });

  } catch (err) {
    console.error("MANAGER REGISTRATION ERROR:", err);
    req.flash('error', 'Could not load registrations.');
    res.redirect('/');
  }
});

module.exports = router;
