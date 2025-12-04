// routes/milestones.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

/**
 * MANAGER-ONLY: summary view of participant milestones
 * - One row per participant
 * - Counts ALL milestones (any MilestoneTitle)
 * - Extra counts for key milestone types Nadia mentioned:
 *   - University / Educational tours
 *   - Leadership summits
 *   - Weekly workshops
 *   - Mariachi practice
 *
 * Assumptions:
 *   - milestones table: participantemail, milestonetitle, milestonedate
 *   - participants table: id, first_name, last_name, email
 *   - milestones.participantemail matches participants.email
 */
router.get('/milestones', requireAuth, requireManager, async (req, res) => {
  try {
    const summaries = await knex('participants as p')
      .leftJoin('milestones as m', 'm.participantemail', 'p.email')
      .groupBy('p.id', 'p.first_name', 'p.last_name', 'p.email')
      .select(
        'p.id',
        'p.first_name',
        'p.last_name',
        'p.email',
        // total milestones for this participant
        knex.raw('COUNT(m.milestonetitle) AS milestone_count'),
        // earliest milestone date
        knex.raw('MIN(m.milestonedate) AS first_milestone_date'),
        // key milestone “categories” from Nadia’s notes
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
      .orderBy('p.last_name')
      .orderBy('p.first_name');

    res.render('milestones/list', {
      title: 'Participant Milestones',
      summaries
    });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Could not load milestones summary');
    res.redirect('/');
  }
});

/**
 * MANAGER-ONLY: detail view for one participant’s milestones
 * Shows EVERY milestone title + date for that participant.
 */
router.get('/participants/:id/milestones', requireAuth, requireManager, async (req, res) => {
  try {
    const participant = await knex('participants')
      .where({ id: req.params.id })
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
    console.error(err);
    req.flash('error', 'Could not load participant milestones');
    res.redirect('/milestones');
  }
});

module.exports = router;