const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

/*
// E-posta gönderici ayarları
const transporter = nodemailer.createTransport({
  service: 'gmail', // Outlook, Yahoo vb. de kullanabilirsiniz
  auth: {
    user: 'eticaret1455@gmail.com', // Gönderici e-posta
    pass: xxxx xxxx xxxx xxxx' // E-posta şifresi veya uygulama şifresi
  }
});
*/

// Üye olma formunu göster
router.get('/musteri-uye-ol', (req, res) => {
  res.render('musteri-uye-ol', { hata: null });
});

// Üye olma işlemini işle
router.post('/musteri-uye-ol', async (req, res) => {
  const { musteri_adi, musteri_soyadi, musteri_email, musteri_tel, musteri_adres, sifre } = req.body;

  try {
    // Şifreyi hash'le
    const hashedSifre = await bcrypt.hash(sifre, 10);
    
    // 6 haneli rastgele doğrulama kodu oluştur
    const dogrulamaKodu = crypto.randomInt(100000, 999999).toString();
    const kodOlusturmaZamani = new Date();

    // Veritabanına müşteri ekleme işlemi (henüz doğrulanmamış)
    const sql = `
      INSERT INTO musteriler 
      (musteri_adi, musteri_soyadi, musteri_email, musteri_tel, musteri_adres, sifre, dogrulama_kodu, kod_olusturma_zamani)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.query(sql, 
      [musteri_adi, musteri_soyadi, musteri_email, musteri_tel, musteri_adres, hashedSifre, dogrulamaKodu, kodOlusturmaZamani], 
      async (err, results) => {
        if (err) {
          console.error(err);
          if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).render('musteri-uye-ol', { 
              hata: 'Bu e-posta veya telefon numarası zaten kayıtlı.' 
            });
          }
          return res.status(500).render('musteri-uye-ol', { 
            hata: 'Üye olurken bir hata oluştu.' 
          });
        }

        // E-posta gönderme işlemi
        try {
          await transporter.sendMail({
            from: '"E-Ticaret Doğrulama" <eticaret1455@gmail.com>',
            to: musteri_email,
            subject: 'Üyelik Doğrulama Kodunuz',
            html: `
              <h2>E-Ticaret Üyelik Doğrulama</h2>
              <p>Merhaba ${musteri_adi},</p>
              <p>Üyelik işleminizi tamamlamak için doğrulama kodunuz:</p>
              <h3 style="background:#f4f4f4;padding:10px;display:inline-block">${dogrulamaKodu}</h3>
              <p>Bu kod 10 dakika boyunca geçerlidir.</p>
              <p>İyi alışverişler dileriz!</p>
            `
          });
          
      // Doğrulama sayfasına yönlendir (? işareti URL'de parametrelerin başladığını gösterir.
      // (eposta-dogrulama?email= diyerek parametre ismini belirliyoruz.)
      // encodeURIComponent string içinde geçen özel karakterlerin stringi karıştırmasını önler
          res.redirect(`/eposta-dogrulama?email=${encodeURIComponent(musteri_email)}`);
        } catch (emailError) {
          console.error('E-posta gönderilemedi:', emailError);
          res.status(500).render('musteri-uye-ol', { 
            hata: 'Doğrulama e-postası gönderilemedi. Lütfen tekrar deneyin.' 
          });
        }
      });
  } catch (error) {
    console.error(error);
    res.status(500).render('musteri-uye-ol', { 
      hata: 'Üye olurken bir hata oluştu.' 
    });
  }
});

// E-posta doğrulama sayfasını göster
router.get('/eposta-dogrulama', (req, res) => {
  const musteri_email = req.query.email;
  if (!musteri_email) return res.redirect('/musteri-uye-ol');
  
  res.render('eposta-dogrulama', { 
    musteri_email,
    hata: req.query.hata 
  });
});

// Doğrulama kodunu kontrol et
router.post('/eposta-dogrulama', async (req, res) => {
  const { musteri_email, dogrulama_kodu } = req.body;
  
  try {
    // Kodu ve süreyi kontrol et
    const sql = `
      SELECT * FROM musteriler 
      WHERE musteri_email = ? 
      AND telefon_dogrulandi = FALSE
      AND dogrulama_kodu = ?
      AND kod_olusturma_zamani >= DATE_SUB(NOW(), INTERVAL 10 MINUTE)
    `;
    
    db.query(sql, [musteri_email, dogrulama_kodu], (err, results) => {
      if (err) {
        console.error(err);
        return res.redirect('/eposta-dogrulama?email=' + encodeURIComponent(musteri_email) + '&hata=Doğrulama sırasında bir hata oluştu');
      }
      
      if (results.length === 0) {
        return res.redirect('/eposta-dogrulama?email=' + encodeURIComponent(musteri_email) + '&hata=Geçersiz veya süresi dolmuş doğrulama kodu');
      }
      
      // Doğrulama başarılı, kullanıcıyı aktif et
      const updateSql = `
        UPDATE musteriler 
        SET telefon_dogrulandi = TRUE, 
            dogrulama_kodu = NULL,
            kod_olusturma_zamani = NULL
        WHERE musteri_email = ?
      `;
      
      db.query(updateSql, [musteri_email], (err, updateResults) => {
        if (err) {
          console.error(err);
          return res.redirect('/eposta-dogrulama?email=' + encodeURIComponent(musteri_email) + '&hata=Doğrulama sırasında bir hata oluştu');
        }
        
        // Başarılı doğrulama, ana sayfaya yönlendir
        res.redirect('/?mesaj=E-postanız başarıyla doğrulandı. Giriş yapabilirsiniz.');
      });
    });
  } catch (error) {
    console.error(error);
    res.redirect('/eposta-dogrulama?email=' + encodeURIComponent(musteri_email) + '&hata=Doğrulama sırasında bir hata oluştu');
  }
});

module.exports = router;