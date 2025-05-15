const express = require('express');
const router = express.Router();
const db = require('../utility/database');

router.post('/urun-sil/:id', (req, res) => {
    const urunId = req.params.id;

    const sql = "DELETE FROM stoklar WHERE urunId=?";
    db.query(sql,[urunId], (err,result)=>{
        if(err){ console.log(err);  } 

        const sql='DELETE FROM urun_tedarik_detay WHERE urunId=?';
        db.query(sql, [urunId], (err, result) => {
            if (err) { console.log(err); } 
             
            const sql = 'DELETE FROM urunler WHERE urun_id = ?';
            db.query(sql, [urunId], (err, result) => {
            if (err) { console.log(err);}
            
            res.redirect('/urun-listele'); 
        }) 
        
    });
    });  
   

    

    
});

module.exports=router;