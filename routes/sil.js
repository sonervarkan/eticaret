const express=require("express");
const router=express.Router();
const db=require("../utility/database");

router.get("/marka-sil/:id", (req, res) => {
    const marka_id = req.params.id;

    const sqlmmh="delete from marka_model_hareket where markaid=?"
    db.query(sqlmmh,[marka_id],(err,results)=>{
        if(err){console.log(err);}

        const sql = "delete from markalar where marka_id=?";
        db.query(sql, [marka_id], (err, results) => {
            if(err) {console.log(err);
    // Hata durumunda da yönlendirme yap yoksa http://localhost:3000/marka-sil/marka-listele
    // adresi şeklinde hata verir
            return res.redirect("/marka-listele");
            }
            // Başında / olan mutlak yol kullanın
            res.redirect("/marka-listele");
        });
    });
});

router.get("/model-sil/:id", (req, res) => {
    const model_id = req.params.id;
    const sqlmmh="delete from marka_model_hareket where modelid=?"
    db.query(sqlmmh,[model_id],(err,results)=>{
        if(err){console.log(err);}

        const sqlModel = "delete from modeller where model_id=?";
        db.query(sqlModel, [model_id], (err, results) => {
            if(err) {
                console.log(err);
        // Hata durumunda da yönlendirme yap yoksa http://localhost:3000/model-sil/model-listele
        // adresi şeklinde hata verir
                return res.redirect("/model-listele");
                }
            // Başında / olan yol kullan
            res.redirect("/model-listele");
        });

    })
   
       
});

router.get("/musteri-sil/:id", (req, res) => {
    const musteri_id = req.params.id;

    const sqlMusteri="delete from kayitli_siparisler where musteriId=?";
    db.query(sqlMusteri,[musteri_id],(err,results)=>{
        if(err)console.log(err);

        const sql = "delete from musteriler where musteri_id=?";
        db.query(sql, [musteri_id], (err, results) => {
            if(err) { console.log(err);
        // Hata durumunda da yönlendirme yap yoksa http://localhost:3000/musteri-sil/musteri-listele
        // adresi şeklinde hata verir
                return res.redirect("/musteri-listele");
            }
            // Başında / olan yol kullanın
            res.redirect("/musteri-listele");
        });
    });
    
});

router.get("/tedarikci-sil/:id", (req, res) => {
    const tedarikci_id = req.params.id;

    // Önce urun_tedarik_detay tablosundan ilişkili kayıtları sil
    const sqlSilDetay = "DELETE FROM urun_tedarik_detay WHERE tedarikciId = ?";
    db.query(sqlSilDetay, [tedarikci_id], (err, results) => {
        if (err) {
            console.log("Ürün-Tedarik detay silme hatası:", err);
            return res.redirect("/tedarikci-listele");
        }

        // Ardından tedarikçiyi sil
        const sqlSilTedarikci = "DELETE FROM tedarikciler WHERE tedarikci_id = ?";
        db.query(sqlSilTedarikci, [tedarikci_id], (err, results) => {
            if (err) {
                console.log("Tedarikçi silme hatası:", err);
                return res.redirect("/tedarikci-listele");
            }

            // Başarılıysa listelemeye yönlendir
            res.redirect("/tedarikci-listele");
        });
    });
});



module.exports=router;