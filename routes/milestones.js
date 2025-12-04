// routes/milestones.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

// helper to build base query with optional search filter
function milestonesBaseQuery(q) {
  const like = `%${q}%`;
  const query = knex('participants as p')
    .leftJoin('milestones as m', 'm.participantemail', 'p.participantemail');

  if (q) {
    query.where(function () {
      this.where('p.participantfirstname', 'ILIKE', like)
        .orWhere('p.participantlastname', 'ILIKE', like)
        .orWhere('p.participantemail', 'ILIKE', like);
    });
  }

  return query;
}

/**
 * Manager only: summary view of participant milestones
 */
router.get('/milestones', requireAuth, requireManager, async (req, res) => {
  try {
    const rawPage = parseInt(req.query.page, 10);
    let page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
    const limit = 25;

    const q = (req.query.q || '').trim();

    // global totals across all pages (respecting search filter)
    const totalsRow = await milestonesBaseQuery(q)
      .clone()
      .clearSelect()
      .clearOrder()
      .select(
        knex.raw('COUNT(DISTINCT p.id) AS total_participants'),
        knex.raw(`
          COUNT(DISTINCT CASE WHEN m.milestonetitle IS NOT NULL THEN p.id END)
          AS participants_with_milestones
        `),
        knex.raw('COUNT(m.milestonetitle) AS total_milestones')
      )
      .first();

    const totalParticipantsAll = parseInt(totalsRow.total_participants, 10) || 0;
    const participantsWithMilestonesAll =
      parseInt(totalsRow.participants_with_milestones, 10) || 0;
    const totalMilestonesAll = parseInt(totalsRow.total_milestones, 10) || 0;

    const totalPages = Math.max(
      1,
      Math.ceil(totalParticipantsAll / limit)
    );

    if (page > totalPages) {
      page = totalPages;
    }

    const offset = (page - 1) * limit;

    // page of summaries with same filter
    const summaries = await milestonesBaseQuery(q)
      .clone()
      .groupBy(
        'p.id',
        'p.participantfirstname',
        'p.participantlastname',
        'p.participantemail'
      )
      .select(
        'p.id',
        knex.raw('p.participantfirstname AS first_name'),
        knex.raw('p.participantlastname AS last_name'),
        knex.raw('p.participantemail AS email'),
        knex.raw('COUNT(m.milestonetitle) AS milestone_count'),
        knex.raw('MIN(m.milestonedate) AS first_milestone_date'),
        knex.raw(`
          SUM(
            CASE
              WHEN m.milestonetitle ILIKE '%tour%'
                   OR m.milestonetitle ILIKE '%university%'
                   OR m.milestonetitle ILIKE '%educational%'
              THEN 1 ELSE 0
            END
          ) AS university_tours
        `),
        knex.raw(`
          SUM(
            CASE
              WHEN m.milestonetitle ILIKE '%summit%'
              THEN 1 ELSE 0
            END
          ) AS leadership_summits
        `),
        knex.raw(`
          SUM(
            CASE
              WHEN m.milestonetitle ILIKE '%workshop%'
              THEN 1 ELSE 0
            END
          ) AS workshops_attended
        `),
        knex.raw(`
          SUM(
            CASE
              WHEN m.milestonetitle ILIKE '%mariachi%'
              THEN 1 ELSE 0
            END
          ) AS mariachi_practice
        `)
      )
      .orderBy('p.participantlastname')
      .orderBy('p.participantfirstname')
      .limit(limit)
      .offset(offset);

    res.render('milestones/list', {
      title: 'Participant Milestones',
      summaries,
      currentPage: page,
      totalPages,
      q,
      totalParticipantsAll,
      participantsWithMilestonesAll,
      totalMilestonesAll
    });
  } catch (err) {
    console.error('Error loading milestones summary', err);
    req.flash('error', 'Could not load milestones summary');
    res.redirect('/');
  }
});

/**
 * Manager only: detail view for one participant milestones
 */
router.get('/participants/:id/milestones', requireAuth, requireManager, async (req, res) => {
  try {
    const participant = await knex('participants as p')
      .where('p.id', req.params.id)
      .select(
        'p.id',
        knex.raw('p.participantfirstname AS first_name'),
        knex.raw('p.participantlastname AS last_name'),
        knex.raw('p.participantemail AS email')
      )
      .first();

    if (!participant) {
      req.flash('error', 'Participant not found');
      return res.redirect('/milestones');
    }

    const milestones = await knex('milestones')
      .where('participantemail', participant.email)
      .orderBy('milestonedate', 'asc');

    res.render('milestones/detail', {
      title: `Milestones for ${participant.first_name} ${participant.last_name}`,
      participant,
      milestones
    });
  } catch (err) {
    console.error('Could not load participant milestones', err);
    req.flash('error', 'Could not load participant milestones');
    res.redirect('/milestones');
  }
});

module.exports = router;








