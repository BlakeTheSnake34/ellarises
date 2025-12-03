const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireAuth, requireManager } = require('../middleware/auth');

// Manager: list all donations
router.get('/donations', requireManager, async (req, res) => {
  const donations = await knex('donations as d')
    .leftJoin('participants as p', 'd.ParticipantEmail', 'p.ParticipantEmail')
    .select(
      'd.DonationID as id',
      'd.ParticipantEmail as email',
      'd.DonationDate as date',
      'd.DonationAmount as amount',
      'p.ParticipantFirstName as first_name',
      'p.ParticipantLastName as last_name'
    )
    .orderBy('d.DonationDate', 'desc');

  res.render('donations/list', { title: 'Donations', donations });
});

// Manager: new donation form
router.get('/donations/new', requireManager, (req, res) => {
  res.render('donations/form', {
    title: 'New Donation',
    donation: {}
  });
});

// Manager: create donation
router.post('/donations', requireManager, async (req, res) => {
  const { participant_email, donation_date, donation_amount } = req.body;

  await knex('donations').insert({
    ParticipantEmail: participant_email,
    DonationDate: donation_date,
    DonationAmount: donation_amount
  });

  req.flash('success', 'Donation recorded');
  res.redirect('/donations');
});

// Manager: edit donation form
router.get('/donations/:id/edit', requireManager, async (req, res) => {
  const donation = await knex('donations')
    .where('DonationID', req.params.id)
    .first();

  if (!donation) {
    req.flash('error', 'Donation not found');
    return res.redirect('/donations');
  }

  res.render('donations/form', {
    title: 'Edit Donation',
    donation
  });
});

// Manager: update donation
router.post('/donations/:id', requireManager, async (req, res) => {
  const { participant_email, donation_date, donation_amount } = req.body;

  await knex('donations')
    .where('DonationID', req.params.id)
    .update({
      ParticipantEmail: participant_email,
      DonationDate: donation_date,
      DonationAmount: donation_amount
    });

  req.flash('success', 'Donation updated');
  res.redirect('/donations');
});

// Manager: delete donation
router.post('/donations/:id/delete', requireManager, async (req, res) => {
  await knex('donations').where('DonationID', req.params.id).delete();
  req.flash('success', 'Donation deleted');
  res.redirect('/donations');
});

// User: see own donations
router.get('/my-donations', requireAuth, async (req, res) => {
  const donations = await knex('donations as d')
    .leftJoin('participants as p', 'd.ParticipantEmail', 'p.ParticipantEmail')
    .select(
      'd.DonationID as id',
      'd.DonationDate as date',
      'd.DonationAmount as amount',
      'p.ParticipantFirstName as first_name',
      'p.ParticipantLastName as last_name'
    )
    .where('d.ParticipantEmail', req.session.user.email)
    .orderBy('d.DonationDate', 'desc');

  res.render('donations/my-list', {
    title: 'My Donations',
    donations
  });
});

// User: make a donation (simple)
router.get('/my-donations/new', requireAuth, (req, res) => {
  res.render('donations/my-form', {
    title: 'Make a Donation',
    donation: {}
  });
});

router.post('/my-donations', requireAuth, async (req, res) => {
  const { donation_date, donation_amount } = req.body;

  await knex('donations').insert({
    ParticipantEmail: req.session.user.email,
    DonationDate: donation_date,
    DonationAmount: donation_amount
  });

  req.flash('success', 'Thank you for your donation!');
  res.redirect('/my-donations');
});

module.exports = router;
