const express=require("express");
const router=express.Router();
const db=require("../utility/database");
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get("/model-listele",authAdmin, (req,res)=>{
    const sql="select * from modeller";
    db.query(sql,(err,results)=>{
        if(err){console.log(err);}
        res.render("model-listele",{modeller:results});
    });
});


module.exports=router;