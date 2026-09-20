const ensureAuthenticated = (req, res, next) => {
  if (req.session.user) return next();
  req.flash('error', 'Please log in to continue');
  res.redirect('/login');
};

const ensureStudent = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'student') return next();
  req.flash('error', 'Student access only');
  res.redirect('/login');
};

const ensureAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') return next();
  req.flash('error', 'Admin access only');
  res.redirect('/login');
};

const redirectIfAuthenticated = (req, res, next) => {
  if (!req.session.user) return next();
  if (req.session.user.role === 'admin') return res.redirect('/admin/dashboard');
  return res.redirect('/student/dashboard');
};

module.exports = { ensureAuthenticated, ensureStudent, ensureAdmin, redirectIfAuthenticated };
