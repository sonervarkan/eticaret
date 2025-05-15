
const express = require("express");
const router = express.Router();
const db = require("../utility/database");

router.get("/siparis-arsiv", (req, res) => {
    if (!req.session.musteri) {
        return res.redirect("/musteri-login");
    }

    const musteriId = req.session.musteri.musteri_id;

    const sorgu = `
        SELECT 
            m.marka_adi,
            mo.model_adi,
            u.urun_resim_url, 
            sd.adet, 
            sd.birim_fiyat, 
            (sd.adet * sd.birim_fiyat) AS toplam_tutar, 
            s.siparis_tarihi
        FROM kayitli_siparisler s
        JOIN kayitli_siparis_detay sd ON sd.siparisId = s.siparis_id
        JOIN urunler u ON u.urun_id = sd.urunId
        JOIN marka_model_hareket mmh ON (mmh.mmh_id=u.mmhId)
        JOIN markalar m ON (mmh.markaId=m.marka_id)
        JOIN modeller mo ON (mmh.modelId=mo.model_id)
        WHERE s.musteriId = ?;
    `;

    db.query(sorgu, [musteriId], (err, results) => {
        if (err) {
            console.error("Siparişler yüklenirken hata oluştu:", err);
            return res.status(500).send("Siparişler yüklenirken bir hata oluştu.");
        }

        res.render("siparis-arsiv", { 
            siparisler: results,
            musteri:req.session.musteri });
    });
});

module.exports = router;