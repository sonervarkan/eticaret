const express = require('express');
const router = express.Router();
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get('/resim-gor', authAdmin, (req, res) => {
    const imageUrl = req.query.url;
    res.render('resim-gor', { imageUrl });
});

module.exports = router;
