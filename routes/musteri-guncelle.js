const express=require("express");
const router=express.Router();
const db=require("../utility/database");
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get("/musteri-guncelle/:id",authAdmin, (req,res)=>{
    const musteri_id=req.params.id;
    const sql="select * from musteriler where musteri_id=?"
    db.query(sql,[musteri_id],(err,results)=>{
        if(err){console.log(err); }
        res.render("musteri-guncelle",{musteri:results[0]});
    });
});

router.post("/musteri-guncelle",(req,res)=>{
    const {musteri_adi,musteri_soyadi,musteri_email,musteri_tel,musteri_adres,musteri_id}=req.body;
   
    const sql="update musteriler set musteri_adi=?, musteri_soyadi=?, musteri_email=?, musteri_tel=?, musteri_adres=? where musteri_id=?"
    db.query(sql,[musteri_adi,musteri_soyadi,musteri_email,musteri_tel,musteri_adres,musteri_id],(err,results)=>{
        if(err){console.log(err);}
        res.redirect("musteri-listele");
    });
});

module.exports=router;