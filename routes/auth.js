// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const knex = require('../db/knex');

const router = express.Router();

// Show login form
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

// Handle login submit
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await knex('users').where({ email }).first();

    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Save minimal user info in session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    req.flash('success', 'Welcome back!');
    res.redirect('/home');    // changed from /dashboard
  } catch (err) {
    console.error(err);
    req.flash('error', 'Login error');
    res.redirect('/login');
  }
});

// Handle logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;

