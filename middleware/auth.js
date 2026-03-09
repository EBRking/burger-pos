function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  req.flash('error', 'กรุณาเข้าสู่ระบบก่อน');
  res.redirect('/auth/login');
}

function isOwner(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'owner') {
    return next();
  }
  req.flash('error', 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้');
  res.redirect('/dashboard');
}

module.exports = { isAuthenticated, isOwner };
