// middleware/auth.js

function requireAuth(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please log in first');
    return res.redirect('/login');
  }
  next();
}

function requireManager(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Please log in first');
    return res.redirect('/login');
  }

  if (req.session.user.role !== 'manager') {
    req.flash('error', 'You do not have permission to access that page');
    return res.redirect('/');
  }
  next();
}

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
