const express = require('express');
const router = express.Router();
const db = require('../utility/database');

// Sipariş sayfasını göster (GET)
router.get('/kayitli-siparis-ver', (req, res) => {
  if (!req.session.musteri) {
    return res.redirect('/musteri-login');
  }

  // Kullanıcının sepetini veritabanından çek (indirimli fiyat kontrolü ile)
  const musteriId = req.session.musteri.musteri_id;
  const sql = `
    SELECT 
      u.urun_id, 
      CASE 
        WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
        ELSE u.urun_fiyati
      END AS urun_fiyati,
      u.urun_resim_url, 
      s.adet
    FROM urunler u
    JOIN sepet s ON s.urunId = u.urun_id
    WHERE s.musteriId = ?
  `;

  db.query(sql, [musteriId], (err, results) => {
    if (err) {
      console.error('Sepet bilgileri çekilirken hata:', err);
      return res.status(500).send('Sepet bilgileri çekilirken bir hata oluştu.');
    }

    // Toplam fiyatı hesapla
    const toplamFiyat = results.reduce((total, item) => {
      return total + (item.urun_fiyati * item.adet);
    }, 0);

    res.render('kayitli-siparis-ver', {
      sepet: results,
      musteri: req.session.musteri,
      toplamFiyat: toplamFiyat.toFixed(2)
    });
  });
});

// Siparişi tamamla (POST)
router.post('/kayitli-siparis-tamamla', (req, res) => {
  if (!req.session.musteri) {
    return res.redirect('/musteri-login');
  }

  const musteriId = req.session.musteri.musteri_id;

  // Sepetteki ürünlerin toplam fiyatını hesapla (indirimli fiyat kontrolü ile)
  const toplamFiyatSql = `
    SELECT SUM(
      CASE 
        WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
        ELSE u.urun_fiyati
      END * s.adet
    ) AS toplam_fiyat
    FROM urunler u
    JOIN sepet s ON s.urunId = u.urun_id
    WHERE s.musteriId = ?
  `;

  db.query(toplamFiyatSql, [musteriId], (err, toplamSonuc) => {
    if (err) {
      console.error('Toplam fiyat hesaplanırken hata:', err);
      return res.status(500).send('Toplam fiyat hesaplanırken bir hata oluştu.');
    }

    const toplamFiyat = toplamSonuc[0].toplam_fiyat || 0;

    // Sepetteki ürünleri sipariş tablosuna ekle
    const insertSql = `
      INSERT INTO kayitli_siparisler (musteriId, siparis_tarihi, toplam_fiyat, durum)
      VALUES (?, NOW(), ?, ?)
    `;

    db.query(insertSql, [musteriId, toplamFiyat, 'ödeme bekleniyor'], (err, results) => {
      if (err) {
        console.error('Sipariş oluşturma hatası:', err);
        return res.status(500).send('Sipariş oluşturulurken bir hata oluştu.');
      }

      const siparisId = results.insertId;

      // Sepetteki ürünleri sipariş detayları tablosuna ekle (indirimli fiyat kontrolü ile)
      const siparisDetaySql = `
        INSERT INTO kayitli_siparis_detay (siparisId, urunId, adet, birim_fiyat)
        SELECT 
          ?, 
          s.urunId, 
          s.adet, 
          CASE 
            WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
            ELSE u.urun_fiyati
          END AS birim_fiyat
        FROM sepet s
        JOIN urunler u ON s.urunId = u.urun_id
        WHERE s.musteriId = ?
      `;

      db.query(siparisDetaySql, [siparisId, musteriId], (err, detaySonuc) => {
        if (err) {
          console.error('Sipariş detayları eklenirken hata:', err);
          return res.status(500).send('Sipariş detayları eklenirken bir hata oluştu.');
        }

        // Sepeti temizle
        const deleteSql = 'DELETE FROM sepet WHERE musteriId = ?';
        db.query(deleteSql, [musteriId], (err, results) => {
          if (err) {
            console.error('Sepet temizleme hatası:', err);
            return res.status(500).send('Sepet temizlenirken bir hata oluştu.');
          }

          res.redirect(`/kayitli-odeme?siparisId=${siparisId}`);
        });
      });
    });
  });
});

module.exports = router;