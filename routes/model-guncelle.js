const express=require("express");
const router=express.Router();
const db=require("../utility/database");
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i

// Sadece adminler erişebilsin diye authAdmin middleware'ini buraya ekledik
router.get("/model-guncelle/:id",authAdmin, (req,res)=>{
    const model_id=req.params.id;
    const sql="select * from modeller where model_id=?"
    db.query(sql,[model_id],(err,results)=>{
        if(err){console.log(err); }
        res.render("model-guncelle",{model:results[0]});
    });
});

router.post("/model-guncelle",(req,res)=>{
    const {model_adi,model_id}=req.body;
   
    const sql="update modeller set model_adi=? where model_id=?"
    db.query(sql,[model_adi,model_id],(err,results)=>{
        if(err){console.log(err);}
        res.redirect("model-listele");
    });
});

module.exports=router;