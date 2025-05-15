const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i


// ÜRÜN LİSTESİNİ EKSİK VERİ OLSA BİLE GÖSTER:
// Kurgu şuydu: önce tedarikci ekledik, sonra o tedarikciden ürün ekledik, bu durumda 
// urun_tedarik_detay tablosuna FK attı, sonra tedarikciyi silince hata verdi
// Dolayısıyla sil.js'de önce utd tablosundan sonra tedarikciler den sildik
// Bu defa da urun listelede tedarikci eksikliğinden dolayı listelemedi
// Bunu da LEFT JOIN ile burada çözdük.
router.get('/urun-listele', authAdmin, (req, res) => {
    const sql = `
        SELECT 
    u.urun_id,
    u.urun_aciklama,
    u.urun_fiyati,
    u.urun_resim_url,
    u.indirimli_fiyat,
    m.marka_adi,
    mo.model_adi,
    k.kategori_adi,
    s.stok_miktari,
    t.tedarikci_firma
    FROM urunler u
    JOIN marka_model_hareket mmh ON u.mmhId = mmh.mmh_id
    JOIN markalar m ON mmh.markaId = m.marka_id
    JOIN modeller mo ON mmh.modelId = mo.model_id
    JOIN kategoriler k ON m.kategoriId = k.kategori_id
    JOIN stoklar s ON u.urun_id = s.urunId
    LEFT JOIN urun_tedarik_detay ut ON u.urun_id = ut.urunId
    LEFT JOIN tedarikciler t ON ut.tedarikciId = t.tedarikci_id
    ORDER BY u.urun_id ASC;

    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error('Ürün listesi alınırken hata:', err);
            return res.status(500).send('Ürün listesi alınırken bir hata oluştu');
        }
        
        res.render('urun-listele', {
            urunler: results,
            success: req.query.success
        });
    });
});

module.exports = router;