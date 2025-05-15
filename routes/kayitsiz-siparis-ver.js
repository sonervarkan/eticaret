const express = require('express');
const router = express.Router();
const db = require('../utility/database');

// Kayıtsız kullanıcı için sipariş sayfasını göster (GET)
router.get('/kayitsiz-siparis-ver', (req, res) => {
  if (req.session.musteri) {
    return res.redirect('/kayitli-siparis-ver');
  }

  const sql = `
    SELECT 
      u.urun_id,  
      u.urun_fiyati,
      u.indirimli_fiyat,
      CASE 
        WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
        ELSE u.urun_fiyati
      END AS gercek_fiyat,
      gs.adet
    FROM urunler u 
    JOIN gecici_sepet gs ON gs.urunId = u.urun_id
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error('Geçici sepet bilgileri çekilirken hata:', err);
      return res.status(500).send('Geçici sepet bilgileri çekilirken bir hata oluştu.');
    }

    // Ürün bazlı toplamları hesapla
    const sepetDetay = results.map(item => ({
      ...item,
      urun_toplam: (item.gercek_fiyat * item.adet).toFixed(2)
    }));

    // Genel toplam fiyatı hesapla
    const toplamFiyat = sepetDetay.reduce((total, item) => {
      return total + (item.gercek_fiyat * item.adet);
    }, 0);

    res.render('kayitsiz-siparis-ver', { 
      sepet: sepetDetay,
      toplamFiyat: toplamFiyat.toFixed(2)
    });
  });
});

// Kayıtsız kullanıcı için sipariş oluşturma (POST)
router.post('/kayitsiz-siparis-tamamla', (req, res) => {
  if (req.session.musteri) {
    return res.redirect('/kayitli-siparis-ver');
  }

  const { musteri_adi, musteri_soyadi, musteri_tel, musteri_email, musteri_adres } = req.body;

  // Önce sepet bilgilerini alalım
  const getSepetSql = `
    SELECT 
      u.urun_id,  
      u.urun_aciklama,
      gs.adet,
      CASE 
        WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
        ELSE u.urun_fiyati
      END AS gercek_fiyat
    FROM urunler u 
    JOIN gecici_sepet gs ON gs.urunId = u.urun_id
  `;

  db.query(getSepetSql, (err, sepetResults) => {
    if (err) {
      console.error('Sepet bilgileri alınırken hata:', err);
      return res.status(500).send('Sepet bilgileri alınırken bir hata oluştu.');
    }

    // Tüm sipariş ID'lerini ve ürün bilgilerini tutmak için dizi
    const siparisler = [];
    
    // Her ürün için ayrı sipariş kaydı oluştur
    function insertNextItem(index) {
      if (index >= sepetResults.length) {
        // Tüm ürünler eklendikten sonra geçici sepeti temizle
        db.query('DELETE FROM gecici_sepet', (err) => {
          if (err) {
            console.error('Geçici sepet temizlenirken hata:', err);
            return res.status(500).send('Geçici sepet temizlenirken bir hata oluştu.');
          }
          
          // Tüm sipariş ID'lerini ve ürün bilgilerini URL'ye ekle
          const siparisBilgileri = encodeURIComponent(JSON.stringify(siparisler));
          res.redirect(`/kayitsiz-odeme?siparisBilgileri=${siparisBilgileri}`);
        });
        return;
      }

      const item = sepetResults[index];
      const urunToplam = (item.gercek_fiyat * item.adet).toFixed(2);
      
      const insertSql = `
        INSERT INTO kayitsiz_siparisler 
          (urunId, adet, siparis_tarihi, musteri_adi, musteri_soyadi, musteri_tel, 
           musteri_email, musteri_adres, toplam_tutar, odeme_durumu)
        VALUES (?, ?, NOW(), ?, ?, ?, ?, ?, ?, 'ödenmedi')
      `;
      
      db.query(insertSql, [
        item.urun_id, 
        item.adet,
        musteri_adi, 
        musteri_soyadi, 
        musteri_tel, 
        musteri_email, 
        musteri_adres, 
        urunToplam
      ], (err, result) => {
        if (err) {
          console.error('Sipariş oluşturma hatası:', err);
          return res.status(500).send('Sipariş oluşturulurken bir hata oluştu.');
        }
        
        // Oluşturulan sipariş bilgilerini listeye ekle
        siparisler.push({
          siparisId: result.insertId,
          urunId: item.urun_id,
          urunAciklama: item.urun_aciklama,
          adet: item.adet,
          birimFiyat: item.gercek_fiyat,
          toplam: urunToplam
        });
        
        // Sonraki ürünü ekle
        insertNextItem(index + 1);
      });
    }

    // İlk ürünü eklemeye başla
    insertNextItem(0);
  });
});

module.exports = router;