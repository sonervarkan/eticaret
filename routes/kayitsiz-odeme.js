const express = require('express');
const router = express.Router();
const db = require('../utility/database');

router.get('/kayitsiz-odeme', (req, res) => {
  if (req.session.musteri) {
    return res.redirect('/kayitli-odeme');
  }

  const siparisBilgileri = req.query.siparisBilgileri;

  if (!siparisBilgileri) {
    return res.status(400).send('Sipariş bilgileri eksik.');
  }

  try {
    const siparisler = JSON.parse(decodeURIComponent(siparisBilgileri));
    
    // Tüm sipariş ID'lerini al
    const siparisIdList = siparisler.map(item => item.siparisId);
    const ilkSiparisId = Math.min(...siparisIdList);

    // Veritabanından tüm sipariş detaylarını getir
    const sql = `
      SELECT 
        ks.*, 
        u.urun_aciklama,
        u.urun_fiyati,
        u.indirimli_fiyat,
        CASE 
          WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
          ELSE u.urun_fiyati
        END AS gercek_fiyat
      FROM kayitsiz_siparisler ks
      JOIN urunler u ON ks.urunId = u.urun_id
      WHERE ks.kayitsiz_siparis_id IN (?)
      ORDER BY ks.kayitsiz_siparis_id
    `;
    
    db.query(sql, [siparisIdList], (err, results) => {
      if (err) {
        console.error('Sipariş bilgileri çekilirken hata:', err);
        return res.status(500).send('Sipariş bilgileri çekilirken bir hata oluştu.');
      }

      if (results.length === 0) {
        return res.status(404).send('Sipariş bulunamadı.');
      }

      // Toplam fiyatı hesapla
      const toplamFiyat = results.reduce((total, item) => {
        return total + (parseFloat(item.gercek_fiyat) * item.adet);
      }, 0);

      res.render('kayitsiz-odeme', { 
        siparisId: ilkSiparisId, // İlk sipariş ID'sini göster
        siparisDetay: results,
        toplamFiyat: toplamFiyat.toFixed(2),
        tumSiparisIdler: siparisIdList.join(',') // Tüm ID'leri gizli input olarak gönder
      });
    });
  } catch (error) {
    console.error('Sipariş bilgileri parse edilirken hata:', error);
    return res.status(400).send('Geçersiz sipariş bilgileri.');
  }
});

router.post('/kayitsiz-odeme-yap', (req, res) => {
  if (req.session.musteri) {
    return res.redirect('/kayitli-odeme');
  }

  const { siparisId, kartNumarasi, sonKullanma, cvv } = req.body;

  if (!siparisId || !kartNumarasi || !sonKullanma || !cvv) {
    return res.status(400).send('Eksik bilgi.');
  }

  // Sipariş ID'lerini diziye çevir
  const siparisIdList = siparisId.split(',').map(id => parseInt(id));

  // Tüm siparişleri güncelle
  const updateSql = `
    UPDATE kayitsiz_siparisler 
    SET odeme_durumu = 'ödendi'
    WHERE kayitsiz_siparis_id IN (?)
  `;

  db.query(updateSql, [siparisIdList], (err, results) => {
    if (err) {
      console.error('Sipariş durumu güncellenirken hata:', err);
      return res.status(500).send('Sipariş durumu güncellenirken bir hata oluştu.');
    }

    // Tüm sipariş detaylarını getir
    const detaySql = `
      SELECT 
        ks.*,
        u.urun_aciklama,
        u.urun_fiyati,
        u.indirimli_fiyat,
        CASE 
          WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
          ELSE u.urun_fiyati
        END AS gercek_fiyat
      FROM kayitsiz_siparisler ks
      JOIN urunler u ON ks.urunId = u.urun_id
      WHERE ks.kayitsiz_siparis_id IN (?)
      ORDER BY ks.kayitsiz_siparis_id
    `;

    db.query(detaySql, [siparisIdList], (err, detayResults) => {
      if (err) {
        console.error('Sipariş detayları çekilirken hata:', err);
        return res.status(500).send('Sipariş detayları çekilirken bir hata oluştu.');
      }

      const toplamFiyat = detayResults.reduce((total, item) => {
        return total + (parseFloat(item.gercek_fiyat) * item.adet);
      }, 0);
      // Her ürün için stoktan düş
      detayResults.forEach((urun) => {
        const stokGuncelleSql = 'UPDATE stoklar SET stok_miktari = stok_miktari - ? WHERE urunId = ?';
        db.query(stokGuncelleSql, [urun.adet, urun.urunId], (err) => {
          if (err) {
            console.error(`Stok güncelleme hatası - Ürün ID: ${urun.urunId}`, err);
          }
        });
        res.render('odeme-tamamlandi', {
        siparisId: siparisIdList[0], // İlk sipariş ID'sini göster
        detaylar: detayResults,
        toplamFiyat: toplamFiyat.toFixed(2)
      });
      });

      
    });
  });
});

module.exports = router;