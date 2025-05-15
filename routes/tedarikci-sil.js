const express = require('express');
const router = express.Router();
const db = require('../utility/database');

router.post('/tedarikci-sil/:id', (req, res) => {
    const tedarikciId = req.params.id;

    const sql = 'DELETE FROM tedarikciler WHERE tedarikci_id = ?';
    db.query(sql, [tedarikciId], (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Tedarikci silinirken bir hata oluştu.');
        }

        res.redirect('/tedarikci-listele');
    });
});

module.exports=router;