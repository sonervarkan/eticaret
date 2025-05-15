const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get('/tedarikci-ekle', authAdmin, (req, res) => {
    res.render('tedarikci-ekle');
});

router.post('/tedarikci-ekle', (req, res) => {
    const { tedarikci_adi, tedarikci_soyadi, tedarikci_firma, tedarikci_tel,tedarikci_email} = req.body;

    const sql = 'INSERT INTO tedarikciler ( tedarikci_adi, tedarikci_soyadi, tedarikci_firma, tedarikci_tel,tedarikci_email) VALUES (?, ?, ?, ?, ?)';    
    db.query(sql, [ tedarikci_adi, tedarikci_soyadi, tedarikci_firma, tedarikci_tel,tedarikci_email], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Tedarikçi ekleme işlemi sırasında bir hata oluştu.');
        }
        res.redirect('/tedarikci-listele');     
    })

});

module.exports = router;