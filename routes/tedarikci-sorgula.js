const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
// Tedarikçi sorgulama formunu göster (GET)
router.get('/tedarikci-sorgula', authAdmin, (req, res) => {
    res.render('tedarikci-sorgula', { tedarikciler: null });
});

// Tedarikçi sorgulama işlemini gerçekleştir (POST)
router.post('/tedarikci-sorgula', (req, res) => {
    const { sorguTipi, sorguDegeri } = req.body;

    let sql;
    switch (sorguTipi) {
        case 'tedarikci_id':
            sql = `
                SELECT 
                    tedarikci_id,
                    tedarikci_adi,
                    tedarikci_soyadi,
                    tedarikci_firma,
                    tedarikci_tel,
                    tedarikci_email
                FROM tedarikciler
                WHERE tedarikci_id = ?
            `;
            break;
        case 'tedarikci_firma':
            sql = `
                SELECT 
                    tedarikci_id,
                    tedarikci_adi,
                    tedarikci_soyadi,
                    tedarikci_firma,
                    tedarikci_tel,
                    tedarikci_email
                FROM tedarikciler
                WHERE tedarikci_firma LIKE ?
            `;
            break;
        case 'tedarikci_tel':
            sql = `
                SELECT 
                    tedarikci_id,
                    tedarikci_adi,
                    tedarikci_soyadi,
                    tedarikci_firma,
                    tedarikci_tel,
                    tedarikci_email
                FROM tedarikciler
                WHERE tedarikci_tel LIKE ?
            `;
            break;
        default:
            return res.status(400).send('Geçersiz sorgu tipi.');
    }

    // ? => else demek (sorgu tipi tedarikci id değilse % ile LIKE sorgusu (içinde geçen ifadeleri bulmak için))
    const sorguDegeriHazir = sorguTipi === 'tedarikci_id' ? sorguDegeri : `%${sorguDegeri}%`;

    // Veritabanı sorgusunu çalıştır
    db.query(sql, [sorguDegeriHazir], (err, results) => {
        if (err) {
            console.log(err);
            res.status(500).send('Sorgu sırasında bir hata oluştu.');
        } else {
            res.render('tedarikci-sorgula', { tedarikciler: results });
        }
    });
});

module.exports = router;