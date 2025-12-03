// routes/participants.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

const PAGE_SIZE = 10;

// List participants with search and pagination
router.get('/participants', requireAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const pageParam = parseInt(req.query.page, 10);
    const currentPage = Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

    const baseQuery = knex('participants');
    const countQuery = knex('participants');

    if (q) {
      const searchTerm = `%${q}%`;
      const applySearch = builder => {
        builder
          .where('participantfirstname', 'ilike', searchTerm)
          .orWhere('participantlastname', 'ilike', searchTerm)
          .orWhere('participantemail', 'ilike', searchTerm);
      };
      baseQuery.where(applySearch);
      countQuery.where(applySearch);
    }

    const [{ count }] = await countQuery.clone().count({ count: '*' });
    const totalCount = parseInt(count, 10) || 0;
    const totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 1;
    const safePage = currentPage > totalPages ? totalPages : currentPage;
    const offset = (safePage - 1) * PAGE_SIZE;

    const participants = await baseQuery
      .select('*')
      .orderBy('participantlastname', 'asc')
      .limit(PAGE_SIZE)
      .offset(offset);

    res.render('participants/list', {
      title: 'Participants',
      participants,
      q,
      currentPage: safePage,
      totalPages
    });
  } catch (err) {
    console.error('List participants error:', err);
    req.flash('error', 'Could not load participants');
    res.redirect('/');
  }
});

// New participant form
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
      participantemail,
      participantfirstname,
      participantlastname,
      participantdob: participantdob || null,
      participantrole: participantrole || null,
      participantphone: participantphone || null,
      participantschooloremployer: participantschooloremployer || null,
      participantfieldofinterest: participantfieldofinterest || null,
      participantzip: participantzip || null
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
        participantemail,
        participantfirstname,
        participantlastname,
        participantdob: participantdob || null,
        participantrole: participantrole || null,
        participantphone: participantphone || null,
        participantschooloremployer: participantschooloremployer || null,
        participantfieldofinterest: participantfieldofinterest || null,
        participantzip: participantzip || null
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
    await knex('participants')
      .where({ id: req.params.id })
      .delete();

    req.flash('success', 'Participant deleted');
    res.redirect('/participants');
  } catch (err) {
    console.error('Delete participant error:', err);
    req.flash('error', 'Could not delete participant');
    res.redirect('/participants');
  }
});

module.exports = router;







