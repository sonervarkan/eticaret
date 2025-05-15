const express=require("express");
const router=express.Router();
const db=require("../utility/database");
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get('/tum-listeler', authAdmin, (req, res) => {
    res.render('tum-listeler');
});

module.exports=router;