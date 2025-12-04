// routes/milestones.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

// helper to get CSRF token safely
function getCsrf(req) {
  try {
    return typeof req.csrfToken === 'function' ? req.csrfToken() : '';
  } catch (e) {
    console.error('CSRF token error (non fatal):', e.message);
    return '';
  }
}

/**
 * Summary view of participant milestones
 * participants:
 *   id, participantfirstname, participantlastname, participantemail, ...
 * milestones:
 *   id, participantemail, milestonetitle, milestonedate
 */

// GET /milestones summary list with optional search and pagination
router.get('/milestones', requireAuth, requireManager, async (req, res) => {
  try {
    const perPage = 10;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const q = (req.query.q || '').trim();

    // base query with left join to milestones
    let baseQuery = knex('participants as p')
      .leftJoin('milestones as m', 'm.participantemail', 'p.participantemail');

    if (q) {
      baseQuery = baseQuery.where(function () {
        this.where('p.participantfirstname', 'ILIKE', `%${q}%`)
          .orWhere('p.participantlastname', 'ILIKE', `%${q}%`)
          .orWhere('p.participantemail', 'ILIKE', `%${q}%`);
      });
    }

    const summariesQuery = baseQuery
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
      .orderBy('p.participantfirstname');

    // wrap summariesQuery to count total grouped rows for pagination
    const countWrapper = knex.from(summariesQuery.as('t')).count('* as c').first();

    const [
      summaries,
      countRow,
      totalsRow,
      participantsWithMilestonesRow
    ] = await Promise.all([
      summariesQuery
        .clone()
        .limit(perPage)
        .offset((page - 1) * perPage),
      countWrapper,
      knex('milestones').count('* as total_milestones').first(),
      knex('milestones')
        .countDistinct('participantemail as participants_with_milestones')
        .first()
    ]);

    const totalRows = parseInt(countRow.c, 10) || 0;
    const totalPages = Math.max(Math.ceil(totalRows / perPage) || 1, 1);

    // header stats for entire dataset
    const totalParticipantsAll = totalRows;
    const participantsWithMilestonesAll =
      parseInt(participantsWithMilestonesRow.participants_with_milestones, 10) || 0;
    const totalMilestonesAll = parseInt(totalsRow.total_milestones, 10) || 0;

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
 * Detail view for one participant milestones
 * GET /participants/:id/milestones
 */
router.get(
  '/participants/:id/milestones',
  requireAuth,
  requireManager,
  async (req, res) => {
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
        .orderBy('milestonedate', 'asc')
        .select(
          'id',
          'milestonetitle',
          'milestonedate'
        );

      res.render('milestones/detail', {
        title: `Milestones for ${participant.first_name} ${participant.last_name}`,
        participant,
        milestones,
        csrfToken: getCsrf(req)
      });
    } catch (err) {
      console.error('Could not load participant milestones', err);
      req.flash('error', 'Could not load participant milestones');
      res.redirect('/milestones');
    }
  }
);

/**
 * New milestone form
 * GET /participants/:id/milestones/new
 */
router.get(
  '/participants/:id/milestones/new',
  requireAuth,
  requireManager,
  async (req, res) => {
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

      res.render('milestones/form', {
        title: 'Add milestone',
        participant,
        milestone: {},
        formAction: `/participants/${participant.id}/milestones`,
        submitLabel: 'Save milestone',
        csrfToken: getCsrf(req)
      });
    } catch (err) {
      console.error('Error loading new milestone form', err);
      req.flash('error', 'Could not load milestone form');
      res.redirect('/milestones');
    }
  }
);

/**
 * Create milestone
 * POST /participants/:id/milestones
 */
router.post(
  '/participants/:id/milestones',
  requireAuth,
  requireManager,
  async (req, res) => {
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

      const { milestonetitle, milestonedate } = req.body;

      await knex('milestones').insert({
        participantemail: participant.email,
        milestonetitle,
        milestonedate: milestonedate || null
      });

      req.flash('success', 'Milestone added');
      res.redirect(`/participants/${participant.id}/milestones`);
    } catch (err) {
      console.error('Error creating milestone', err);
      req.flash('error', 'Could not create milestone');
      res.redirect('/milestones');
    }
  }
);

/**
 * Edit milestone form
 * GET /milestones/:id/edit
 */
router.get(
  '/milestones/:id/edit',
  requireAuth,
  requireManager,
  async (req, res) => {
    try {
      const milestone = await knex('milestones')
        .where('id', req.params.id)
        .first();

      if (!milestone) {
        req.flash('error', 'Milestone not found');
        return res.redirect('/milestones');
      }

      const participant = await knex('participants as p')
        .where('p.participantemail', milestone.participantemail)
        .select(
          'p.id',
          knex.raw('p.participantfirstname AS first_name'),
          knex.raw('p.participantlastname AS last_name'),
          knex.raw('p.participantemail AS email')
        )
        .first();

      if (!participant) {
        req.flash('error', 'Participant not found for this milestone');
        return res.redirect('/milestones');
      }

      res.render('milestones/form', {
        title: 'Edit milestone',
        participant,
        milestone: {
          id: milestone.id,
          milestonetitle: milestone.milestonetitle,
          milestonedate: milestone.milestonedate
        },
        formAction: `/milestones/${milestone.id}`,
        submitLabel: 'Update milestone',
        csrfToken: getCsrf(req)
      });
    } catch (err) {
      console.error('Error loading edit milestone form', err);
      req.flash('error', 'Could not load milestone form');
      res.redirect('/milestones');
    }
  }
);

/**
 * Update milestone
 * POST /milestones/:id
 */
router.post(
  '/milestones/:id',
  requireAuth,
  requireManager,
  async (req, res) => {
    try {
      const { milestonetitle, milestonedate, participant_id } = req.body;

      await knex('milestones')
        .where('id', req.params.id)
        .update({
          milestonetitle,
          milestonedate: milestonedate || null
        });

      req.flash('success', 'Milestone updated');

      if (participant_id) {
        return res.redirect(`/participants/${participant_id}/milestones`);
      }

      res.redirect('/milestones');
    } catch (err) {
      console.error('Error updating milestone', err);
      req.flash('error', 'Could not update milestone');
      res.redirect('/milestones');
    }
  }
);

/**
 * Delete milestone
 * POST /milestones/:id/delete
 */
router.post(
  '/milestones/:id/delete',
  requireAuth,
  requireManager,
  async (req, res) => {
    try {
      const { participant_id } = req.body;

      await knex('milestones')
        .where('id', req.params.id)
        .del();

      req.flash('success', 'Milestone deleted');

      if (participant_id) {
        return res.redirect(`/participants/${participant_id}/milestones`);
      }

      res.redirect('/milestones');
    } catch (err) {
      console.error('Error deleting milestone', err);
      req.flash('error', 'Could not delete milestone');
      res.redirect('/milestones');
    }
  }
);

module.exports = router;
















