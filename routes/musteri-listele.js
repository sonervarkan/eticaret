const express=require("express");
const router=express.Router();
const db=require("../utility/database");
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get("/musteri-listele",authAdmin, (req,res)=>{
    const sql="select * from musteriler"
    db.query(sql,(err,results)=>{
        if(err){console.log(err);}
        res.render("musteri-listele",{musteriler:results});
    });
});

module.exports=router;