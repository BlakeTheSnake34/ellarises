// routes/admin.js
const express = require('express');
const router = express.Router();
const knex = require('../db/knex');
const { requireManager } = require('../middleware/auth');

// Show manager tools page
router.get('/admin/make-manager', requireManager, (req, res) => {
  res.render('admin/make-manager', {
    title: 'Manager Access',
    csrfToken: req.csrfToken()
  });
});

// Promote user to manager
router.post('/admin/make-manager', requireManager, async (req, res) => {
  const emailRaw = req.body.email || '';
  const normalizedEmail = emailRaw.toLowerCase().trim();

  if (!normalizedEmail) {
    req.flash('error', 'Please enter an email address');
    return res.redirect('/admin/make-manager');
  }

  try {
    const user = await knex('users')
      .where({ email: normalizedEmail })
      .first();

    if (!user) {
      req.flash('error', 'No user exists with that email. Ask them to sign up first, then try again.');
      return res.redirect('/admin/make-manager');
    }

    if (user.role === 'manager') {
      req.flash('success', 'That user is already a manager.');
      return res.redirect('/admin/make-manager');
    }

    await knex.transaction(async trx => {
      await trx('users')
        .where({ email: normalizedEmail })
        .update({ role: 'manager' });

      await trx('participants')
        .where({ participantemail: normalizedEmail })
        .update({ participantrole: 'manager' });
    });

    req.flash('success', `Promoted ${normalizedEmail} to manager.`);
    res.redirect('/admin/make-manager');

  } catch (err) {
    console.error('Promote to manager error:', err);
    req.flash('error', 'Could not promote that user to manager.');
    res.redirect('/admin/make-manager');
  }
});

// Demote manager back to regular user
router.post('/admin/remove-manager', requireManager, async (req, res) => {
  const emailRaw = req.body.email || '';
  const normalizedEmail = emailRaw.toLowerCase().trim();

  if (!normalizedEmail) {
    req.flash('error', 'Please enter an email address');
    return res.redirect('/admin/make-manager');
  }

  try {
    const user = await knex('users')
      .where({ email: normalizedEmail })
      .first();

    if (!user) {
      req.flash('error', 'No user exists with that email.');
      return res.redirect('/admin/make-manager');
    }

    if (user.role !== 'manager') {
      req.flash('error', 'That user is not a manager.');
      return res.redirect('/admin/make-manager');
    }

    // Optional guard: do not allow demote of self
    if (req.session.user && req.session.user.email === normalizedEmail) {
      req.flash('error', 'You cannot remove your own manager access.');
      return res.redirect('/admin/make-manager');
    }

    await knex.transaction(async trx => {
      await trx('users')
        .where({ email: normalizedEmail })
        .update({ role: 'user' });

      await trx('participants')
        .where({ participantemail: normalizedEmail })
        .update({ participantrole: 'user' });
    });

    req.flash('success', `Removed manager access from ${normalizedEmail}.`);
    res.redirect('/admin/make-manager');

  } catch (err) {
    console.error('Remove manager error:', err);
    req.flash('error', 'Could not remove manager access.');
    res.redirect('/admin/make-manager');
  }
});

module.exports = router;

