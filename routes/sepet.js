const express = require('express');
const router = express.Router();
const db = require('../utility/database');


// Sepet sayfasını göster (GET)
router.get('/sepet', (req, res) => {
  let sepet = [];

  // Avantajlı kısmının işlemleri
  const urunId = req.query.urunId;
  if (urunId) {
    if (req.session.musteri) {
      // ➤ Kullanıcı giriş yaptıysa: ürün sepete eklensin
      const musteriId = req.session.musteri.musteri_id;

      const kontrolSql = `SELECT * FROM sepet WHERE musteriId = ? AND urunId = ?`;
      db.query(kontrolSql, [musteriId, urunId], (err, kontrolResult) => {
        if (err) {
          console.error('Sepet kontrolü sırasında hata:', err);
          return res.status(500).send('Sunucu hatası');
        }

        if (kontrolResult.length > 0) {
          const guncelleSql = `UPDATE sepet SET adet = adet + 1 WHERE musteriId = ? AND urunId = ?`;
          db.query(guncelleSql, [musteriId, urunId], (err) => {
            if (err) console.error('Sepet güncelleme hatası:', err);
            return renderSepet();
          });
        } else {
          const fiyatSql = `
            SELECT 
              CASE 
                WHEN indirimli_fiyat IS NOT NULL AND indirimli_fiyat > 0 
                THEN indirimli_fiyat 
                ELSE urun_fiyati 
              END AS fiyat 
            FROM urunler 
            WHERE urun_id = ?`;
          db.query(fiyatSql, [urunId], (err, fiyatResult) => {
            if (err) {
              console.error('Fiyat sorgusu hatası:', err);
              return res.status(500).send('Fiyat alınırken hata oluştu');
            }

            const fiyat = fiyatResult[0]?.fiyat || 0;

            const ekleSql = `INSERT INTO sepet (musteriId, urunId, adet, fiyat, eklenme_tarihi) VALUES (?, ?, 1, ?, NOW())`;
            db.query(ekleSql, [musteriId, urunId, fiyat], (err) => {
              if (err) console.error('Sepete ekleme hatası:', err);
              return renderSepet();
            });
          });
        }
      });
    } else {
      // ➤ Kullanıcı giriş yapmamışsa: ürün geçici sepete eklensin
      const kontrolSql = `SELECT * FROM gecici_sepet WHERE urunId = ?`;
      db.query(kontrolSql, [urunId], (err, kontrolResult) => {
        if (err) {
          console.error('Geçici sepet kontrolü sırasında hata:', err);
          return res.status(500).send('Sunucu hatası');
        }

        if (kontrolResult.length > 0) {
          const guncelleSql = `UPDATE gecici_sepet SET adet = adet + 1 WHERE urunId = ?`;
          db.query(guncelleSql, [urunId], (err) => {
            if (err) console.error('Geçici sepet güncelleme hatası:', err);
            return renderSepet();
          });
        } else {
          const ekleSql = `INSERT INTO gecici_sepet (urunId, adet) VALUES (?, 1)`;
          db.query(ekleSql, [urunId], (err) => {
            if (err) console.error('Geçici sepete ekleme hatası:', err);
            return renderSepet();
          });
        }
      });
    }
  } else {
    // ürünId yoksa doğrudan sepeti göster
    renderSepet();
  }

  // Diğer sepet işlemleri
  function renderSepet() {
    if (req.session.musteri) {
      const musteriId = req.session.musteri.musteri_id;
      const sql = `
        SELECT 
          u.urun_id,  
          m.marka_adi,
          mo.model_adi,
          CASE 
            WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
            ELSE u.urun_fiyati
          END AS urun_fiyati,
          u.urun_resim_url, 
          s.adet
        FROM urunler u
        JOIN marka_model_hareket mmh ON (mmh.mmh_id=u.mmhId)
        JOIN markalar m ON m.marka_id = mmh.markaId
        JOIN modeller mo ON mo.model_id = mmh.modelId
        JOIN sepet s ON s.urunId = u.urun_id
        WHERE s.musteriId = ?
      `;
      db.query(sql, [musteriId], (err, results) => {
        if (err) {
          console.error('Sepet bilgileri çekilirken hata:', err);
          res.status(500).send('Sepet bilgileri çekilirken bir hata oluştu.');
        } else {
          sepet = results;
          res.render('sepet', { sepet, musteri: req.session.musteri });
        }
      });
    } else {
      const sql = `
        SELECT 
          u.urun_id, 
          m.marka_adi,
          mo.model_adi,
          CASE 
            WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
            ELSE u.urun_fiyati
          END AS urun_fiyati,
          u.urun_resim_url, 
          gs.adet
        FROM urunler u
        JOIN marka_model_hareket mmh ON (mmh.mmh_id=u.mmhId)
        JOIN markalar m ON m.marka_id = mmh.markaId
        JOIN modeller mo ON mo.model_id = mmh.modelId
        JOIN gecici_sepet gs ON gs.urunId = u.urun_id
      `;
      db.query(sql, (err, results) => {
        if (err) {
          console.error('Geçici sepet bilgileri çekilirken hata:', err);
          res.status(500).send('Geçici sepet bilgileri çekilirken bir hata oluştu.');
        } else {
          sepet = results;
          res.render('sepet', { sepet, musteri: null });
        }
      });
    }
  }
});


// Sepete ürün ekleme (POST)
router.post('/sepet', (req, res) => {
  const { urunId, adet } = req.body;

  const miktar = parseInt(adet) || 1;

  // Önce stok kontrolü yap
  const stokSql = 'SELECT stok_miktari FROM stoklar WHERE urunId = ?';
  db.query(stokSql, [urunId], (err, stokResult) => {
    if (err) {
      console.error('Stok kontrol hatası:', err);
      return res.status(500).send('Stok kontrolü sırasında bir hata oluştu.');
    }

    const mevcutStok = stokResult[0]?.stok_miktari || 0;
    if (miktar > mevcutStok) {
      return res.send(`<script>alert('Stok yetersiz! Mevcut stok: ${mevcutStok}'); window.location.href='/sepet';</script>`);
    }

    // Oturum yoksa: YANİ KULLANICI GİRİŞİ YAPILMAMIŞSA geçici sepete ekle
    if (!req.session.musteri) {
      const checkSql = 'SELECT * FROM gecici_sepet WHERE urunId = ?';
      db.query(checkSql, [urunId], (err, results) => {
        if (err) {
          console.error('Geçici sepet kontrol hatası:', err);
          return res.status(500).send('Geçici sepet kontrolü sırasında bir hata oluştu.');
        }
        // geçici sepette aynı ürün id bulunuyorsa güncelle
        if (results.length > 0) {
          const updateSql = 'UPDATE gecici_sepet SET adet = adet + ? WHERE urunId = ?';
          db.query(updateSql, [miktar, urunId], (err) => {
            if (err) {
              console.error('Geçici sepet güncelleme hatası:', err);
              return res.status(500).send('Geçici sepet güncelleme sırasında bir hata oluştu.');
            }
            res.redirect('/sepet');
          });
        } else { // geçici sepette aynı ürün id bulunmuyorsa yeni ekle
          const insertSql = 'INSERT INTO gecici_sepet (urunId, adet) VALUES (?, ?)';
          db.query(insertSql, [urunId, miktar], (err) => {
            if (err) {
              console.error('Geçici sepete ekleme hatası:', err);
              return res.status(500).send('Geçici sepete ekleme sırasında bir hata oluştu.');
            }
            res.redirect('/sepet');
          });
        }
      });
    } else {
      // KULLANICI GİRİŞİ YAPILMIŞSA
      const musteriId = req.session.musteri.musteri_id;

      const getUrunSql = `
        SELECT 
          CASE 
            WHEN indirimli_fiyat IS NOT NULL AND indirimli_fiyat > 0 
            THEN indirimli_fiyat 
            ELSE urun_fiyati 
          END AS fiyat 
        FROM urunler 
        WHERE urun_id = ?`;

      db.query(getUrunSql, [urunId], (err, urunResult) => {
        if (err) {
          console.error('Ürün bilgisi alınırken hata:', err);
          return res.status(500).send('Ürün bilgisi alınırken hata oluştu.');
        }

        const currentFiyat = urunResult[0]?.fiyat;

        const checkSql = 'SELECT * FROM sepet WHERE musteriId = ? AND urunId = ?';
        db.query(checkSql, [musteriId, urunId], (err, results) => {
          if (err) {
            console.error('Sepet kontrol hatası:', err);
            return res.status(500).send('Sepet kontrolü sırasında bir hata oluştu.');
          }
          // Sepette o müşterinin ürünü varsa sepettekileri güncelle
          if (results.length > 0) {
            const updateSql = 'UPDATE sepet SET adet = adet + ? WHERE musteriId = ? AND urunId = ?';
            db.query(updateSql, [miktar, musteriId, urunId], (err) => {
              if (err) {
                console.error('Sepet güncelleme hatası:', err);
                return res.status(500).send('Sepet güncelleme sırasında bir hata oluştu.');
              }
              res.redirect('/sepet');
            });
          } else { // Sepette o müşterinin ürünü yoksa yeni ekle 
            const insertSql = 'INSERT INTO sepet (musteriId, urunId, adet, fiyat, eklenme_tarihi) VALUES (?, ?, ?, ?, NOW())';
            db.query(insertSql, [musteriId, urunId, miktar, currentFiyat], (err) => {
              if (err) {
                console.error('Sepete ekleme hatası:', err);
                return res.status(500).send('Sepete ekleme sırasında bir hata oluştu.');
              }
              res.redirect('/sepet');
            });
          }
        });
      });
    }
  });
});



// Sepetten ürün kaldırma endpoint'i (POST)
router.post('/sepetten-cikar', (req, res) => {
  const urunId = req.body.urunId;

  if (!urunId) {
    return res.status(400).json({ success: false, message: 'Ürün ID eksik.' });
  }

  if (req.session.musteri) {
    const query = 'DELETE FROM sepet WHERE urunId = ? AND musteriId = ?';
    db.query(query, [urunId, req.session.musteri.musteri_id], (err, result) => {
      if (err) {
        console.error('Veritabanı hatası:', err);
        return res.status(500).json({ success: false, message: 'Ürün sepetten kaldırılırken bir hata oluştu.' });
      }
      res.redirect('/sepet');
    });
  } else {
    const query = 'DELETE FROM gecici_sepet WHERE urunId = ?';
    db.query(query, [urunId], (err, result) => {
      if (err) {
        console.error('Veritabanı hatası:', err);
        return res.status(500).json({ success: false, message: 'Ürün sepetten kaldırılırken bir hata oluştu.' });
      }
      res.redirect('/sepet');
    });
  }
});

module.exports = router;
