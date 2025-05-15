const express=require("express");
const router=express.Router();
const db=require("../utility/database");

router.get("/hakkimizda",(req,res)=>{
    res.render("hakkimizda");
});

module.exports=router;