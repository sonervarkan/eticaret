const express = require("express");
const router = express.Router();
const db = require("../utility/database");
const authAdmin = require("../middleware/authAdmin");  // Erişim kontrolü middleware'i



// Marka güncelleme formunu göster
router.get("/marka-guncelle/:id", authAdmin, (req, res) => {  // :id parametresi eklendi
    const marka_id = req.params.id;
    
    // Önce marka bilgilerini al
    const markaSql = "SELECT * FROM markalar WHERE marka_id = ?";
    // Sonra kategorileri al
    const kategoriSql = "SELECT * FROM kategoriler";
    
    db.query(markaSql, [marka_id], (err, markaResult) => {
        if(err) { console.log(err); return res.status(500).send("Hata oluştu"); }
        
        db.query(kategoriSql, (err, kategoriResults) => {
            if(err) { console.log(err); return res.status(500).send("Hata oluştu"); }
            
            res.render("marka-guncelle", {
                marka: markaResult[0],  // Güncellenecek marka bilgileri
                kategoriler: kategoriResults
            });
        });
    });
});

// Marka güncelleme işlemini işle
router.post("/marka-guncelle", (req, res) => {
    const{marka_id,marka_adi,kategori_id}=req.body;
    const sql="update markalar set marka_adi=?, kategoriId=? where marka_id=?";
    db.query(sql,[marka_adi,kategori_id,marka_id],(err,results)=>{
        if(err){console.log(err);}
        res.redirect("marka-listele");
    })
});

module.exports = router;