// middleware/authAdmin.js
module.exports = (req, res, next) => {
  if (req.session.loggedIn && (req.session.rolId === 1 || req.session.rolId === 2) ) {
    next(); // Admin ise devam et
  } else {
    res.redirect('/admin-login'); // Değilse giriş sayfasına yönlendir
  }
};

