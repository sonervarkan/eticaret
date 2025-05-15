const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
// Ürün güncelleme formunu göster
router.get('/urun-guncelle/:id', authAdmin, (req, res) => {
    const urunId = req.params.id;

    // Ürün bilgilerini al
    db.query('SELECT * FROM urunler WHERE urun_id = ?', [urunId], (err, urunBilgisi) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Ürün bilgileri alınırken hata oluştu');
        }

        if (urunBilgisi.length === 0) {
            return res.status(404).send('Ürün bulunamadı.');
        }

        // Markaları al
        db.query('SELECT * FROM markalar', (err, markalar) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Markalar alınırken hata oluştu');
            }

            // Modelleri al
            db.query('SELECT * FROM modeller', (err, modeller) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send('Modeller alınırken hata oluştu');
                }

                // Kategorileri al
                db.query('SELECT * FROM kategoriler', (err, kategoriler) => {
                    if (err) {
                        console.error(err);
                        return res.status(500).send('Kategoriler alınırken hata oluştu');
                    }

                    // Tedarikçileri al
                    db.query('SELECT tedarikci_id, tedarikci_firma FROM tedarikciler', (err, tedarikciler) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Tedarikçiler alınırken hata oluştu');
                        }

                        // Stok bilgisini al
                        db.query('SELECT stok_miktari FROM stoklar WHERE urunId = ?', [urunId], (err, stokBilgisi) => {
                            if (err) {
                                console.error(err);
                                return res.status(500).send('Stok bilgisi alınırken hata oluştu');
                            }

                            // Ürün-tedarikçi ilişkisini al
                            db.query(
                                'SELECT tedarikciId FROM urun_tedarik_detay WHERE urunId = ? LIMIT 1',
                                [urunId],
                                (err, tedarikciBilgisi) => {
                                    if (err) {
                                        console.error(err);
                                        return res.status(500).send('Tedarikçi bilgisi alınırken hata oluştu');
                                    }

                                    // Marka-model hareket bilgisini al
                                    db.query(
                                        'SELECT markaId, modelId FROM marka_model_hareket WHERE mmh_id = ?',
                                        [urunBilgisi[0].mmhId],
                                        (err, mmhBilgisi) => {
                                            if (err) {
                                                console.error(err);
                                                return res.status(500).send('Marka-model bilgisi alınırken hata oluştu');
                                            }
// ?: "Optional chaining" operatörüdür. Eğer stokBilgisi[0] tanımlı değilse (örneğin 
// undefined veya null ise), stok_miktari alanına bakmaya çalışmadan undefined döner. 
// stokBilgisi[0]?.stok_miktari || 0 => aslında burası stokBilgisi[0].stok_miktari ya da 0 koy demek
                                               res.render('urun-guncelle', {
                                                urun: urunBilgisi[0],
                                                markalar,
                                                modeller,
                                                kategoriler,
                                                tedarikciler,
                                                stokMiktari: stokBilgisi[0]?.stok_miktari || 0,
                                                seciliTedarikci: tedarikciBilgisi[0]?.tedarikciId || null,
                                                seciliMarka: mmhBilgisi[0]?.markaId || null,
                                                seciliModel: mmhBilgisi[0]?.modelId || null,
                                                seciliKategori: markalar.kategoriId
                                            });


                                        }
                                    );
                                }
                            );
                        });
                    });
                });
            });
        });
    });
});

// Ürün güncelleme işlemini gerçekleştir
router.post('/urun-guncelle/:id', (req, res) => {
    const urunId = req.params.id;
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
// ? null : Number(...)=> Eğer değer boş string ('') ise, indirimli_fiyat değişkenine null atanır. 
// Eğer boş değilse, req.body.indirimli_fiyat değeri sayıya çevrilerek (Number(...)) atanır.
// Yani şöyle okumak lazım:
// [şart ? eylem]=> eğer... ise (?)....yap [: eylem]=> yoksa .....yap  
    const indirimli_fiyat = req.body.indirimli_fiyat === '' ? null : Number(req.body.indirimli_fiyat);

    // Önce marka-model kombinasyonunu kontrol et
    db.query(
        'SELECT mmh_id FROM marka_model_hareket WHERE markaId = ? AND modelId = ?',
        [marka, model],
        (err, mmhResults) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Marka-model kontrolü sırasında hata oluştu');
            }

            let mmhId;
            if (mmhResults.length > 0) {
                // Kombinasyon zaten varsa ID'sini al
                mmhId = mmhResults[0].mmh_id;
                updateProduct();
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
                        updateProduct();
                    }
                );
            }

            function updateProduct() {
                // Ürün bilgilerini güncelle (mmhId kullanarak)
                db.query(
                    'UPDATE urunler SET urun_aciklama = ?, urun_fiyati = ?, urun_resim_url = ?, indirimli_fiyat = ?, mmhId = ? WHERE urun_id = ?',
                    [urun_aciklama, urun_fiyati, urun_resim_url, indirimli_fiyat, mmhId, urunId],
                    (err) => {
                        if (err) {
                            console.error(err);
                            return res.status(500).send('Ürün güncellenirken hata oluştu');
                        }

                        // Stok bilgilerini güncelle
                        db.query(
                            'UPDATE stoklar SET stok_miktari = ? WHERE urunId = ?',
                            [stok_miktari, urunId],
                            (err) => {
                                if (err) {
                                    console.error(err);
                                    return res.status(500).send('Stok güncellenirken hata oluştu');
                                }

                                // Ürün-tedarikçi ilişkisini güncelle
                                db.query(
                                    'UPDATE urun_tedarik_detay SET tedarikciId = ? WHERE urunId = ?',
                                    [tedarikci_firma, urunId],
                                    (err) => {
                                        if (err) {
                                            console.error(err);
                                            return res.status(500).send('Tedarikçi ilişkisi güncellenirken hata oluştu');
                                        }

                                        res.redirect('/urun-listele?success=true');
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