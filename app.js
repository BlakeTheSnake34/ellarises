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
const homeRoutes = require('./routes/home');           // new
const dashboardRoutes = require('./routes/dashboard');
const participantRoutes = require('./routes/participants');
const eventRoutes = require('./routes/events');
const surveyRoutes = require('./routes/surveys');
const registrationRoutes = require('./routes/registrations'); // new
const donationRoutes = require('./routes/donations');
// later: milestones, donations

const app = express();

// Security headers
app.use(helmet());

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static folder
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-key',
    resave: false,
    saveUninitialized: false,
  })
);

// Flash messages
app.use(flash());

// CSRF protection setup
app.use(csrf());

// Make csrf token available to all views
app.use((req, res, next) => {
  res.locals.csrfToken = req.csrfToken();
  next();
});

// Inject logged-in user + flash messages into all EJS views
app.use(injectUser);

// Routes
app.use('/', publicRoutes);
app.use('/', authRoutes);
app.use('/', homeRoutes);          // home screen for logged-in users
app.use('/', dashboardRoutes);
app.use('/', participantRoutes);
app.use('/', eventRoutes);
app.use('/', surveyRoutes);
app.use('/', registrationRoutes);
app.use('/', donationRoutes);

// IS 404 Requirement: HTTP 418
app.get('/teapot', (req, res) => {
  res.status(418).send("I'm a teapot");
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('public/landing', { title: 'Page Not Found' });
});

// Global error handler
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




