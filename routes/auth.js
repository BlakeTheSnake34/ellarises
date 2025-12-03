// routes/auth.js

const express = require('express');
const bcrypt = require('bcrypt');
const knex = require('../db/knex');

const router = express.Router();

/* =========================================
   SIGNUP — Show Signup Page
========================================= */
router.get('/signup', (req, res) => {
  res.render('auth/signup', {
    title: 'Create Account',
    csrfToken: req.csrfToken()
  });
});

/* =========================================
   SIGNUP — Handle Signup Form
   Creates both a user and a participant row
   All signups are regular users (role "user")
========================================= */
router.post('/signup', async (req, res) => {
  const {
    email,
    password,
    first_name,
    last_name,
    dob,
    phone,
    school_or_employer,
    field_of_interest,
    zip
  } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();
    const role = 'user';

    // check for existing user or participant
    const existingUser = await knex('users')
      .where({ email: normalizedEmail })
      .first();

    const existingParticipant = await knex('participants')
      .where({ participantemail: normalizedEmail })
      .first();

    if (existingUser || existingParticipant) {
      req.flash('error', 'An account with that email already exists.');
      return res.redirect('/signup');
    }

    // hash password
    const password_hash = await bcrypt.hash(password, 10);

    let newUser;

    // transaction for both inserts
    await knex.transaction(async trx => {
      // insert into users
      const [insertedUser] = await trx('users')
        .insert(
          {
            email: normalizedEmail,
            password_hash,
            role
          },
          ['id', 'email', 'role']
        );

      newUser = insertedUser;

      // insert into participants
      await trx('participants').insert({
        participantemail: normalizedEmail,
        participantfirstname: first_name || '',
        participantlastname: last_name || '',
        participantdob: dob || null,
        participantrole: role,
        participantphone: phone || '',
        participantschooloremployer: school_or_employer || '',
        participantfieldofinterest: field_of_interest || '',
        participantzip: zip || ''
      });
    });

    // auto login
    req.session.user = {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role
    };

    req.flash('success', 'Account created successfully!');
    res.redirect('/home');

  } catch (err) {
    console.error('Signup error:', err);
    req.flash('error', 'Signup failed: ' + err.message);
    res.redirect('/signup');
  }
});

/* =========================================
   LOGIN — Show Login Page
========================================= */
router.get('/login', (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    csrfToken: req.csrfToken()
  });
});

/* =========================================
   LOGIN — Handle Login Form
========================================= */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const normalizedEmail = email.toLowerCase().trim();

    const user = await knex('users')
      .where({ email: normalizedEmail })
      .first();

    if (!user) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/login');
    }

    req.session.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };

    req.flash('success', 'Welcome back!');
    res.redirect('/home');

  } catch (err) {
    console.error('Login error:', err);
    req.flash('error', 'Login error: ' + err.message);
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


