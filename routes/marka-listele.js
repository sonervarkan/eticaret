const express=require("express");
const router=express.Router();
const db=require("../utility/database");
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get("/marka-listele",authAdmin, (req,res)=>{
    const sql=`select * from markalar m JOIN kategoriler k ON (m.kategoriId=k.kategori_id)
    order by marka_id`;
    db.query(sql,(err,results)=>{
        if(err){console.log(err);}
        res.render("marka-listele",{markalar:results});
    });
});

module.exports=router;