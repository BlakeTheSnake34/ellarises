// routes/participants.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

// List participants
router.get('/participants', requireAuth, async (req, res) => {
  const participants = await knex('participants').select('*');
  res.render('participants/list', { title: 'Participants', participants });
});

// New participant form (manager only)
router.get('/participants/new', requireManager, (req, res) => {
  res.render('participants/form', {
    title: 'New Participant',
    participant: {}
  });
});

// Create participant (manager only)
router.post('/participants', requireManager, async (req, res) => {
  const { first_name, last_name, email } = req.body;

  await knex('participants').insert({
    first_name,
    last_name,
    email
  });

  req.flash('success', 'Participant created');
  res.redirect('/participants');
});

// Edit form
router.get('/participants/:id/edit', requireManager, async (req, res) => {
  const participant = await knex('participants')
    .where({ id: req.params.id })
    .first();

  if (!participant) {
    req.flash('error', 'Participant not found');
    return res.redirect('/participants');
  }

  res.render('participants/form', {
    title: 'Edit Participant',
    participant
  });
});

// Update participant
router.post('/participants/:id', requireManager, async (req, res) => {
  const { first_name, last_name, email } = req.body;

  await knex('participants')
    .where({ id: req.params.id })
    .update({
      first_name,
      last_name,
      email
    });

  req.flash('success', 'Participant updated');
  res.redirect('/participants');
});

// Delete participant
router.post('/participants/:id/delete', requireManager, async (req, res) => {
  await knex('participants')
    .where({ id: req.params.id })
    .delete();

  req.flash('success', 'Participant deleted');
  res.redirect('/participants');
});

module.exports = router;
