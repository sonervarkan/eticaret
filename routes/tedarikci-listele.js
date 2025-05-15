const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get('/tedarikci-listele', authAdmin, (req, res) => {
    const sql='SELECT * FROM tedarikciler';
    db.query(sql, (err,result)=>{
        if(err){
            console.log(err);
        }    
        res.render('tedarikci-listele',{tedarikciler:result});
    });
  
}); 

module.exports = router;    
