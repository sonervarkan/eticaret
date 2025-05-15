const express=require("express");
const router=express.Router();
const db=require("../utility/database");

router.get("/iletisim",(req,res)=>{
    res.render("iletisim");
});

module.exports=router;