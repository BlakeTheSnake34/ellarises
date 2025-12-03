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
const surveyRoutes = require('./routes/surveys');        // <-- IMPORTANT
const registrationRoutes = require('./routes/registrations');
const donationRoutes = require('./routes/donations');

const app = express();

// Security headers
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "script-src": ["'self'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:"],
      }
    }
  })
);

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsing
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

// Flash messages
app.use(flash());

// CSRF protection
app.use(csrf());

app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Inject logged-in user & flash messages
app.use(injectUser);

/* ============================
   ROUTES (In Correct Order)
============================ */

// Public + login routes
app.use('/', publicRoutes);
app.use('/', authRoutes);

// Pages user sees after logging in
app.use('/', homeRoutes);
app.use('/', dashboardRoutes);

// Normal site features
app.use('/', participantRoutes);
app.use('/', eventRoutes);
app.use('/', registrationRoutes);
app.use('/', donationRoutes);

// SURVEY ROUTES — MUST be mounted ONLY here
app.use('/surveys', surveyRoutes);

// Teapot (IS 404 requirement)
app.get('/teapot', (req, res) => {
  res.status(418).send("I'm a teapot");
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('public/landing', { title: 'Page Not Found' });
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
