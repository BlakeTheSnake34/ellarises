// Load environment variables (SESSION_SECRET, DB credentials, etc.)
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const helmet = require('helmet');
const csrf = require('csurf');
const path = require('path');

const { injectUser } = require('./middleware/auth');

// Route imports
const publicRoutes = require('./routes/public');
const authRoutes = require('./routes/auth');
const homeRoutes = require('./routes/home');
const dashboardRoutes = require('./routes/dashboard');
const participantRoutes = require('./routes/participants');
const eventRoutes = require('./routes/events');
// registrations removed on purpose
const donationRoutes = require('./routes/donations');
const adminRoutes = require('./routes/admin');
const surveyRoutes = require('./routes/surveys');
const milestonesRoutes = require('./routes/milestones');

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],

        // Allow Tableau scripts
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://public.tableau.com',
          'https://public.tableau.com/javascripts/api/'
        ],

        // Allow Google Fonts plus inline styles
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com'
        ],

        // Allow Google Fonts host
        fontSrc: [
          "'self'",
          'https://fonts.gstatic.com',
          'data:'
        ],

        // Allow Tableau images and embedded content
        imgSrc: [
          "'self'",
          'data:',
          'https://public.tableau.com'
        ],

        // Allow Tableau iframe embeds
        frameSrc: [
          "'self'",
          'https://public.tableau.com'
        ]
      }
    }
  })
);

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false
  })
);

// Flash messages
app.use(flash());

// CSRF protection
app.use(csrf());

// Make CSRF token available to all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Inject logged in user and flash messages
app.use(injectUser);

/* ===========================
   ROUTES (ORDER MATTERS)
=========================== */

// Public and auth routes
app.use('/', publicRoutes);
app.use('/', authRoutes);

// Logged in pages
app.use('/', homeRoutes);
app.use('/', dashboardRoutes);

// Main site routes
app.use('/', participantRoutes);
app.use('/', eventRoutes);
// registrations routes removed
app.use('/', donationRoutes);
app.use('/', adminRoutes);
app.use('/', milestonesRoutes);

// Surveys mounted under /surveys
app.use('/surveys', surveyRoutes);

// IS 404 requirement
app.get('/teapot', (req, res) => {
  res.status(418).send("I'm a teapot");
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('public/landing', { title: 'Page Not Found', stats: { participants: 0, events: 0, donations: 0 } });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).send('CSRF token validation failed.');
  }

  res.status(500).send('Internal Server Error.');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Ella Rises app running at http://localhost:${PORT}`);
});


