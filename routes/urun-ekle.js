const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
// Ürün ekleme formunu göster
router.get('/urun-ekle', authAdmin, (req, res) => {
    // Tüm gerekli verileri sırayla al
    db.query('SELECT * FROM markalar', (err, markalar) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Markalar yüklenirken bir hata oluştu');
        }
        
        db.query('SELECT * FROM modeller', (err, modeller) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Modeller yüklenirken bir hata oluştu');
            }
            
            db.query('SELECT * FROM kategoriler', (err, kategoriler) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Kategoriler yüklenirken bir hata oluştu');
                }
                
                db.query('SELECT tedarikci_id, tedarikci_firma FROM tedarikciler', (err, tedarikciler) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Tedarikçiler yüklenirken bir hata oluştu');
                    }
                    
                    res.render('urun-ekle', {
                        markalar: markalar,
                        modeller: modeller,
                        kategoriler: kategoriler,
                        tedarikciler: tedarikciler
                    });
                });
            });
        });
    });
});

// Ürün ekleme işlemini işle
router.post('/urun-ekle', (req, res) => {
    const {
        urun_aciklama,
        urun_fiyati,
        urun_resim_url,
        stok_miktari,
        tedarikci_firma,
        marka,
        model,
        kategori
    } = req.body;

    const indirimli_fiyat = req.body.indirimli_fiyat === '' ? null : Number(req.body.indirimli_fiyat);

    // Önce marka_model_hareket tablosunda bu kombinasyon var mı kontrol et
    db.query(
        'SELECT mmh_id FROM marka_model_hareket WHERE markaId = ? AND modelId = ?',
        [marka, model],
        (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Marka-model kontrolü sırasında hata oluştu');
            }

            let mmhId;
            if (results.length > 0) {
                // Kombinasyon zaten varsa ID'sini al
                mmhId = results[0].mmh_id;
                insertUrun();
            } else {
                // Kombinasyon yoksa yeni bir kayıt oluştur
                db.query(
                    'INSERT INTO marka_model_hareket (markaId, modelId) VALUES (?, ?)',
                    [marka, model],
                    (err, result) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Marka-model kombinasyonu eklenirken hata oluştu');
                        }
                        mmhId = result.insertId;
                        insertUrun();
                    }
                );
            }

            function insertUrun() {
                // Ürünü veritabanına ekle (artık mmhId kullanıyoruz)
                db.query(
                    'INSERT INTO urunler (urun_aciklama, urun_fiyati, urun_resim_url, indirimli_fiyat, mmhId) VALUES (?, ?, ?, ?, ?)',
                    [urun_aciklama, urun_fiyati, urun_resim_url, indirimli_fiyat, mmhId, kategori],
                    (err, urunResult) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Ürün eklenirken bir hata oluştu');
                        }

                        // Yeni eklenen ürünün ID'sini al
                        const urunId = urunResult.insertId;

                        // Stok tablosuna ekleme
                        db.query(
                            'INSERT INTO stoklar (urunId, stok_miktari) VALUES (?, ?)',
                            [urunId, stok_miktari],
                            (err) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).send('Stok eklenirken bir hata oluştu');
                                }

                                // Ürün-tedarikçi ilişkisini ekleme
                                db.query(
                                    'INSERT INTO urun_tedarik_detay (urunId, tedarikciId) VALUES (?, ?)',
                                    [urunId, tedarikci_firma],
                                    (err) => {
                                        if (err) {
                                            console.error(err);
                                            return res.status(500).send('Tedarikçi ilişkisi eklenirken bir hata oluştu');
                                        }

                                        res.redirect('/urun-listele');
                                    }
                                );
                            }
                        );
                    }
                );
            }
        }
    );
});

module.exports = router;