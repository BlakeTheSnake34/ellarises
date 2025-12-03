// routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const knex = require('../db/knex');

const router = express.Router();

/* =========================================
   SIGNUP — Show Signup Page
========================================= */
router.get('/signup', (req, res) => {
  res.render('auth/signup', { title: 'Create Account' });
});

/* =========================================
   SIGNUP — Handle Signup Form
========================================= */
router.post('/signup', async (req, res) => {
  const { email, password, first_name, last_name } = req.body;

  try {
    // Check if user already exists
    const existing = await knex('users').where({ email }).first();
    if (existing) {
      req.flash('error', 'Email already exists');
      return res.redirect('/signup');
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // 1️⃣ Create user in users table
    const [insertedUser] = await knex('users')
      .insert(
        {
          email,
          password_hash,
          role: 'U' // U = normal user
        },
        ['id']
      );

    // 2️⃣ Create matching participant row
    await knex('participants').insert({
      email,
      first_name: first_name || '',
      last_name: last_name || ''
    });

    // 3️⃣ Log user in
    req.session.user = {
      id: insertedUser.id,
      email,
      role: 'U'
    };

    req.flash('success', 'Account created successfully!');
    res.redirect('/home');

  } catch (err) {
    console.error('Signup error:', err);
    req.flash('error', 'Could not create account.');
    res.redirect('/signup');
  }
});

/* =========================================
   LOGIN — Show Login Page
========================================= */
router.get('/login', (req, res) => {
  res.render('auth/login', { title: 'Login' });
});

/* =========================================
   LOGIN — Handle Login Form
========================================= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await knex('users').where({ email }).first();

    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Compare passwords
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    // Save user in session
    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    req.flash('success', 'Welcome back!');
    res.redirect('/home');

  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Login error');
    res.redirect('/login');
  }
});

/* =========================================
   LOGOUT
========================================= */
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

module.exports = router;
