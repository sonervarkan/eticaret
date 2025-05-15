const express = require('express');
const router = express.Router();
const db = require('../utility/database');

// Kayıtlı kullanıcı için ödeme sayfasını göster (GET)
router.get('/kayitli-odeme', (req, res) => {
  if (!req.session.musteri) {
    return res.redirect('/musteri-login');
  }

  const siparisId = req.query.siparisId;

  if (!siparisId) {
    return res.status(400).send('Sipariş ID eksik.');
  }

  // Sipariş bilgilerini veritabanından çek
  const siparisSql = 'SELECT * FROM kayitli_siparisler WHERE siparis_id = ? AND musteriId = ?';
  db.query(siparisSql, [siparisId, req.session.musteri.musteri_id], (err, siparisResults) => {
    if (err) {
      console.error('Sipariş bilgileri çekilirken hata:', err);
      return res.status(500).send('Sipariş bilgileri çekilirken bir hata oluştu.');
    }

    if (siparisResults.length === 0) {
      return res.status(404).send('Sipariş bulunamadı.');
    }

    const siparis = siparisResults[0];

    // Sipariş detaylarını çek (indirimli fiyat kontrolü ile)
    const detaySql = `
      SELECT 
        u.urun_fiyati,
        u.indirimli_fiyat,
        sd.adet,
        sd.birim_fiyat
      FROM 
        kayitli_siparis_detay sd
      INNER JOIN 
        urunler u ON sd.urunId = u.urun_id
      WHERE 
        sd.siparisId = ?
    `;

    db.query(detaySql, [siparisId], (err, detayResults) => {
      if (err) {
        console.error('Sipariş detayları çekilirken hata:', err);
        return res.status(500).send('Sipariş detayları çekilirken bir hata oluştu.');
      }

      if (detayResults.length === 0) {
        return res.status(404).send('Sipariş detayları bulunamadı.');
      }

      res.render('kayitli-odeme', {
        siparisId,
        siparis,
        detaylar: detayResults,
        musteri: req.session.musteri
      });
    });
  });
});

// Kayıtlı kullanıcı için ödeme işlemini tamamla (POST)
router.post('/kayitli-odeme-yap', (req, res) => {
  if (!req.session.musteri) {
    return res.redirect('/musteri-login');
  }

  const { siparisId, kartNumarasi, sonKullanma, cvv } = req.body;

  if (!siparisId || !kartNumarasi || !sonKullanma || !cvv) {
    return res.status(400).send('Eksik bilgi.');
  }

  // Ödeme işlemini simüle et
  console.log(`Sipariş ID: ${siparisId} için ödeme alındı.`);
  console.log(`Kart Numarası: ${kartNumarasi}, Son Kullanma: ${sonKullanma}, CVV: ${cvv}`);

  // Sipariş durumunu güncelle
  const updateSql = 'UPDATE kayitli_siparisler SET durum = ? WHERE siparis_id = ? AND musteriId = ?';
  db.query(updateSql, ['ödeme_alındı', siparisId, req.session.musteri.musteri_id], (err, results) => {
    if (err) {
      console.error('Sipariş durumu güncellenirken hata:', err);
      return res.status(500).send('Sipariş durumu güncellenirken bir hata oluştu.');
    }

    // Sipariş detaylarını çek (indirimli fiyat kontrolü ile)
    const detaySql = `
      SELECT 
        sd.urunId,
        u.urun_fiyati,
        u.indirimli_fiyat,
        sd.adet,
        sd.birim_fiyat
      FROM 
        kayitli_siparis_detay sd
      INNER JOIN 
        urunler u ON sd.urunId = u.urun_id
      WHERE 
        sd.siparisId = ?
    `;

    db.query(detaySql, [siparisId], (err, detayResults) => {
      if (err) {
        console.error('Sipariş detayları çekilirken hata:', err);
        return res.status(500).send('Sipariş detayları çekilirken bir hata oluştu.');
      }

      if (detayResults.length === 0) {
        return res.status(404).send('Sipariş detayları bulunamadı.');
      }
      // Her ürün için stoktan düş
      detayResults.forEach((urun) => {
        const stokGuncelleSql = 'UPDATE stoklar SET stok_miktari = stok_miktari - ? WHERE urunId = ?';
        db.query(stokGuncelleSql, [urun.adet, urun.urunId], (err) => {
          if (err) {
            console.error(`Stok güncelleme hatası - Ürün ID: ${urun.urunId}`, err);
            // Burada stok hatası olursa sistem durmasın, sadece loglansın.
          }
        });
        res.render('odeme-tamamlandi', {
        siparisId,
        detaylar: detayResults,
        musteri: req.session.musteri
      });
      });

      
    });
  });
});

module.exports = router;