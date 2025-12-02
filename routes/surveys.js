// routes/surveys.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

//
// MANAGER VIEW: list all survey results
//
router.get('/surveys', requireManager, async (req, res) => {
  const surveys = await knex('surveys as s')
    .leftJoin('participants as p', 's.participant_id', 'p.id')
    .leftJoin('events as e', 's.event_id', 'e.id')
    .select(
      's.*',
      knex.raw("concat(p.first_name, ' ', p.last_name) as participant_name"),
      'e.name as event_name'
    )
    .orderBy('s.created_at', 'desc');

  res.render('surveys/list', { title: 'Survey Results (Admin)', surveys });
});

//
// USER + MANAGER: take a survey (create)
// We’ll use ?event_id= and ?participant_id= for now.
//
router.get('/surveys/new', requireAuth, async (req, res) => {
  const participants = await knex('participants')
    .select('id', 'first_name', 'last_name')
    .orderBy('first_name');

  const events = await knex('events')
    .select('id', 'name')
    .orderBy('name');

  // Optional preselection from query string
  const survey = {
    participant_id: req.query.participant_id ? Number(req.query.participant_id) : null,
    event_id: req.query.event_id ? Number(req.query.event_id) : null
  };

  res.render('surveys/form', {
    title: 'Post-Event Survey',
    survey,
    participants,
    events
  });
});

router.post('/surveys', requireAuth, async (req, res) => {
  const {
    participant_id,
    event_id,
    satisfaction_rating,
    usefulness_rating,
    recommend_rating,
    comments
  } = req.body;

  await knex('surveys').insert({
    participant_id,
    event_id,
    satisfaction_rating,
    usefulness_rating,
    recommend_rating,
    comments
  });

  req.flash('success', 'Thank you for your feedback!');
  res.redirect('/thanks'); // we can make a simple thank-you view or redirect home
});

//
// MANAGER: edit / update / delete
//
router.get('/surveys/:id/edit', requireManager, async (req, res) => {
  const survey = await knex('surveys').where({ id: req.params.id }).first();

  if (!survey) {
    req.flash('error', 'Survey not found');
    return res.redirect('/surveys');
  }

  const participants = await knex('participants')
    .select('id', 'first_name', 'last_name')
    .orderBy('first_name');
  const events = await knex('events').select('id', 'name').orderBy('name');

  res.render('surveys/form', {
    title: 'Edit Survey',
    survey,
    participants,
    events
  });
});

router.post('/surveys/:id', requireManager, async (req, res) => {
  const {
    participant_id,
    event_id,
    satisfaction_rating,
    usefulness_rating,
    recommend_rating,
    comments
  } = req.body;

  await knex('surveys')
    .where({ id: req.params.id })
    .update({
      participant_id,
      event_id,
      satisfaction_rating,
      usefulness_rating,
      recommend_rating,
      comments
    });

  req.flash('success', 'Survey updated');
  res.redirect('/surveys');
});

router.post('/surveys/:id/delete', requireManager, async (req, res) => {
  await knex('surveys').where({ id: req.params.id }).delete();
  req.flash('success', 'Survey deleted');
  res.redirect('/surveys');
});

module.exports = router;

