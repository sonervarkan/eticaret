const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
// Tedarikçi bilgilerini getirme
router.get('/tedarikci-guncelle/:id', authAdmin, (req, res) => {
    const tedarikciId = req.params.id;

    const sql = 'SELECT * FROM tedarikciler WHERE tedarikci_id = ?';
    db.query(sql, [tedarikciId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Tedarikçi bilgileri alınırken bir hata oluştu.');
        }

        if (result.length === 0) {
            return res.status(404).send('Tedarikçi bulunamadı.');
        }

        res.render('tedarikci-guncelle', { tedarikci: result[0] });
    });
});

// Tedarikçi bilgilerini güncelleme
router.post('/tedarikci-guncelle/:id', (req, res) => {
    const tedarikciId = req.params.id;
    const { tedarikci_adi, tedarikci_soyadi, tedarikci_firma, tedarikci_tel,tedarikci_email } = req.body;

    const sql = 'UPDATE tedarikciler SET tedarikci_adi = ?, tedarikci_soyadi = ?, tedarikci_firma = ?, tedarikci_tel = ?, tedarikci_email = ? WHERE tedarikci_id = ?';
    db.query(sql, [tedarikci_adi, tedarikci_soyadi, tedarikci_firma, tedarikci_tel, tedarikci_email, tedarikciId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Tedarikçi bilgileri güncellenirken bir hata oluştu.');
        }

        res.redirect('/tedarikci-listele');
    });
});

module.exports = router;