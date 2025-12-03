// routes/participants.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

const PAGE_SIZE = 10;

// List participants with search and pagination
router.get('/participants', requireAuth, async (req, res) => {
  try {
    const participants = await knex('participants')
      .select(
        'id',
        'participantfirstname as first_name',
        'participantlastname as last_name',
        'participantemail as email'
      );

    res.render('participants/list', {
      title: 'Participants',
      participants
    });

  } catch (err) {
    console.error("Error loading participants:", err);
    req.flash('error', 'Could not load participants');
    res.redirect('/');
  }
});

// New participant form (Manager only)
router.get('/participants/new', requireManager, (req, res) => {
  res.render('participants/form', {
    title: 'New Participant',
    participant: {}
  });
});

// Create participant
router.post('/participants', requireManager, async (req, res) => {
  try {
    const {
      participantemail,
      participantfirstname,
      participantlastname,
      participantdob,
      participantrole,
      participantphone,
      participantschooloremployer,
      participantfieldofinterest,
      participantzip
    } = req.body;

    await knex('participants').insert({
      participantfirstname: first_name,
      participantlastname: last_name,
      participantemail: email
    });

    req.flash('success', 'Participant created');
    res.redirect('/participants');

  } catch (err) {
    console.error('Create participant error:', err);
    req.flash('error', 'Could not create participant');
    res.redirect('/participants');
  }
});

// Edit participant form
router.get('/participants/:id/edit', requireManager, async (req, res) => {
  try {
    const participant = await knex('participants')
      .where({ id: req.params.id })
      .select(
        'id',
        'participantfirstname as first_name',
        'participantlastname as last_name',
        'participantemail as email'
      )
      .first();

    if (!participant) {
      req.flash('error', 'Participant not found');
      return res.redirect('/participants');
    }

    res.render('participants/form', {
      title: 'Edit Participant',
      participant
    });

  } catch (err) {
    console.error('Load edit participant error:', err);
    req.flash('error', 'Could not load participant');
    res.redirect('/participants');
  }
});

// Update participant
router.post('/participants/:id', requireManager, async (req, res) => {
  try {
    const {
      participantemail,
      participantfirstname,
      participantlastname,
      participantdob,
      participantrole,
      participantphone,
      participantschooloremployer,
      participantfieldofinterest,
      participantzip
    } = req.body;

    await knex('participants')
      .where({ id: req.params.id })
      .update({
        participantfirstname: first_name,
        participantlastname: last_name,
        participantemail: email
      });

    req.flash('success', 'Participant updated');
    res.redirect('/participants');

  } catch (err) {
    console.error('Update participant error:', err);
    req.flash('error', 'Could not update participant');
    res.redirect('/participants');
  }
});

// Delete participant
router.post('/participants/:id/delete', requireManager, async (req, res) => {
  try {
    await knex('participants').where({ id: req.params.id }).delete();
    req.flash('success', 'Participant deleted');
  } catch (err) {
    console.error('Delete participant error:', err);
    req.flash('error', 'Could not delete participant');
  }

  res.redirect('/participants');
});

module.exports = router;







