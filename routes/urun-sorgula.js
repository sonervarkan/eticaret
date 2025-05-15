const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
// Ürün sorgulama formunu göster (GET)
router.get('/urun-sorgula', authAdmin, (req, res) => {
    res.render('urun-sorgula', { urunler: null });
});

// Ürün sorgulama işlemini gerçekleştir (POST)
router.post('/urun-sorgula', (req, res) => {
    const { sorguTipi, sorguDegeri } = req.body;

    let sql;
    switch (sorguTipi) {
        case 'urun_id':
            sql = `
                SELECT 
                    u.urun_id,
                    u.urun_aciklama,
                    u.urun_fiyati,
                    m.marka_adi, 
                    mo.model_adi,
                    t.tedarikci_firma,
                    u.urun_resim_url
                FROM urunler u
                INNER JOIN marka_model_hareket mmh ON (mmh.mmh_id=u.mmhId)
                INNER JOIN markalar m ON mmh.markaId = m.marka_id
                INNER JOIN modeller mo ON mmh.modelId = mo.model_id
                INNER JOIN urun_tedarik_detay ut ON u.urun_id = ut.urunId
                INNER JOIN tedarikciler t ON ut.tedarikciId = t.tedarikci_id
                WHERE urun_id=?
            `;
            break;
        case 'tedarikci_firma':
            sql = `
                SELECT 
                     u.urun_id,
                    u.urun_aciklama,
                    u.urun_fiyati,
                    m.marka_adi, 
                    mo.model_adi,
                    t.tedarikci_firma,
                    u.urun_resim_url
                FROM urunler u
                INNER JOIN marka_model_hareket mmh ON (mmh.mmh_id=u.mmhId)
                INNER JOIN markalar m ON mmh.markaId = m.marka_id
                INNER JOIN modeller mo ON mmh.modelId = mo.model_id
                INNER JOIN urun_tedarik_detay ut ON u.urun_id = ut.urunId
                INNER JOIN tedarikciler t ON ut.tedarikciId = t.tedarikci_id
                WHERE t.tedarikci_firma LIKE ?
            `;
            break;
        case 'marka_adi':
            sql = `
                SELECT 
                    u.urun_id,
                    u.urun_aciklama,
                    u.urun_fiyati,
                    m.marka_adi, 
                    mo.model_adi,
                    t.tedarikci_firma,
                    u.urun_resim_url
                FROM urunler u
                INNER JOIN marka_model_hareket mmh ON (mmh.mmh_id=u.mmhId)
                INNER JOIN markalar m ON mmh.markaId = m.marka_id
                INNER JOIN modeller mo ON mmh.modelId = mo.model_id
                INNER JOIN urun_tedarik_detay ut ON u.urun_id = ut.urunId
                INNER JOIN tedarikciler t ON ut.tedarikciId = t.tedarikci_id
                WHERE m.marka_adi LIKE ?
            `;
            break;
        default:
            return res.status(400).send('Geçersiz sorgu tipi.');
    }

    // ? => else demek (sorgu tipi urun id değilse % ile LIKE sorgusu (içinde geçen ifadeleri bulmak için))
    const sorguDegeriHazir = sorguTipi === 'urun_id' ? sorguDegeri : `%${sorguDegeri}%`;

    // Veritabanı sorgusunu çalıştır
    db.query(sql, [sorguDegeriHazir], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Sorgu sırasında bir hata oluştu.');
        } else {
            res.render('urun-sorgula', { urunler: results });
        }
    });
});
module.exports = router;