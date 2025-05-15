const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const bcrypt = require('bcrypt');

// Müşteri giriş formunu göster
router.get('/musteri-login', (req, res) => {
  res.render('musteri-login', { error: null });
});

// Müşteri giriş işlemini işle
router.post('/musteri-login', async (req, res) => {
  const { musteri_email, musteri_tel, sifre } = req.body;

  // Giriş bilgilerini kontrol et
  if (!musteri_email || !musteri_tel || !sifre) {
    return res.status(400).render('musteri-login', { error: 'Lütfen tüm alanları doldurun.' });
  }

  try {
    // Veritabanında kullanıcıyı kontrol et
    const sql = `
      SELECT * FROM musteriler 
      WHERE musteri_email = ? AND musteri_tel = ?
    `;

    db.query(sql, [musteri_email, musteri_tel], async (err, results) => {
      if (err) {
        console.error('Veritabanı hatası:', err);
        return res.status(500).render('musteri-login', { error: 'Giriş işlemi sırasında bir hata oluştu.' });
      }

      // Kullanıcı bulunamazsa hata mesajı göster
      if (results.length === 0) {
        return res.status(400).render('musteri-login', { error: 'E-posta veya telefon numarası hatalı.' });
      }

      // Kullanıcı bulundu, şifreyi kontrol et
      const musteri = results[0];
      const sifreEslesiyor = await bcrypt.compare(sifre, musteri.sifre);

      if (!sifreEslesiyor) {
        return res.status(400).render('musteri-login', { error: 'Şifre hatalı.' });
      }

      // Giriş başarılı, oturumu başlat
      req.session.musteri = musteri;

      // Geçici sepet varsa, asıl sepete aktar
      const geciciSepetSql = 'SELECT * FROM gecici_sepet';
      db.query(geciciSepetSql, async (err, geciciSepetResults) => {
        if (err) {
          console.error('Geçici sepet çekme hatası:', err);
          return res.status(500).render('musteri-login', { error: 'Geçici sepet aktarımı sırasında bir hata oluştu.' });
        }

        if (geciciSepetResults.length > 0) {
          const musteriId = musteri.musteri_id;

          // Geçici sepeti asıl sepete aktar
          for (const item of geciciSepetResults) {
            const { urunId, adet } = item;

            // Ürün sepette var mı kontrol et
            const checkSql = 'SELECT * FROM sepet WHERE musteriId = ? AND urunId = ?';
            db.query(checkSql, [musteriId, urunId], (err, sepetResults) => {
              if (err) {
                console.error('Sepet kontrol hatası:', err);
                return;
              }

              if (sepetResults.length > 0) {
                // Ürün sepette varsa, adet sayısını artır
                const updateSql = 'UPDATE sepet SET adet = adet + ? WHERE musteriId = ? AND urunId = ?';
                db.query(updateSql, [adet, musteriId, urunId], (err, results) => {
                  if (err) {
                    console.error('Sepet güncelleme hatası:', err);
                  }
                });
              } else {
                // Ürün sepette yoksa, yeni bir kayıt ekle
                const insertSql = 'INSERT INTO sepet (musteriId, urunId, adet, eklenme_tarihi) VALUES (?, ?, ?, NOW())';
                db.query(insertSql, [musteriId, urunId, adet], (err, results) => {
                  if (err) {
                    console.error('Sepete ekleme hatası:', err);
                  }
                });
              }
            });
          }

          // Geçici sepeti temizle
          const clearSql = 'DELETE FROM gecici_sepet';
          db.query(clearSql, (err, results) => {
            if (err) {
              console.error('Geçici sepet temizleme hatası:', err);
            }
          });
        }

        // Başarılı giriş sonrası ana sayfaya yönlendir
        res.redirect('/');
      });
    });
  } catch (error) {
    console.error('Giriş işlemi hatası:', error);
    res.status(500).render('musteri-login', { error: 'Giriş işlemi sırasında bir hata oluştu.' });
  }
});

module.exports = router;