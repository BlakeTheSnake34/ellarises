// middleware/auth.js

// Require any logged-in user
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash('error', 'Please log in first');
    return res.redirect('/login');
  }
  next();
}

// Require manager role
function requireManager(req, res, next) {
  if (!req.session || !req.session.user) {
    req.flash('error', 'Please log in first');
    return res.redirect('/login');
  }

  if (req.session.user.role !== 'manager') {
    req.flash('error', 'Managers only');
    return res.redirect('/home');
  }

  next();
}

// Inject the logged-in user + flash messages into every EJS view
function injectUser(req, res, next) {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  next();
}

module.exports = {
  requireAuth,
  requireManager,
  injectUser
};
