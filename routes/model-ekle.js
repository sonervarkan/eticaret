const express=require("express");
const router=express.Router();
const db=require("../utility/database");
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get("/model-ekle",authAdmin, (req,res)=>{
    res.render("model-ekle");
});

router.post("/model-ekle",(req,res)=>{
    const model_adi=req.body.model_adi;
    const sql="insert into modeller (model_adi) values(?)";
    db.query(sql,[model_adi],(err,results)=>{
        if(err){console.log(err);}
        res.redirect("model-listele");
    });
});

module.exports=router;