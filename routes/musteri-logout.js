const express = require('express');
const router = express.Router();

// Çıkış yap
router.get('/musteri-logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Çıkış yapılırken bir hata oluştu:', err);
      return res.status(500).send('Çıkış yapılırken bir hata oluştu.');
    }
    res.redirect('/'); // Ana sayfaya yönlendir
  });
});

module.exports = router;