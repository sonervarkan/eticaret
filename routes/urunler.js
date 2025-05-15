const express = require('express');
const router = express.Router();
const db = require('../utility/database');

// Tüm ürünleri listele
router.get('/urunler', (req, res) => {
  // Veritabanından ürünleri çek
  const sqlUrunleriGetir = 'SELECT * FROM urunler';
  db.query(sqlUrunleriGetir, (err, results) => {
    if (err) {
      console.error('Ürünler çekilirken hata oluştu:', err);
      res.status(500).send('Ürünler çekilirken bir hata oluştu.');
    } else {
      // Ürünleri ve oturum bilgilerini urunler.pug dosyasına gönder
      const musteri = req.session.musteri || null; // Oturum bilgilerini al
      res.render('urunler', { urunler: results, musteri });
    }
  });
});

module.exports = router;