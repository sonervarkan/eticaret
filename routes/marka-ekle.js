const express = require("express");
const router = express.Router();
const db = require("../utility/database");
const authAdmin = require("../middleware/authAdmin");

// Marka ekleme formu (sadece admin erişebilir)
router.get("/marka-ekle", authAdmin, (req, res) => {
  const sql = "SELECT * FROM kategoriler";
  db.query(sql, (err, results) => {
    if (err) {
      console.log(err);
    }
    res.render("marka-ekle", { kategoriler: results });
  });
});

// Marka ekleme form verisi gönderildiğinde (yine sadece admin erişebilir)
router.post("/marka-ekle", authAdmin, (req, res) => {
  const kategoriId = req.body.kategori_id;
  const marka_adi = req.body.marka_adi;
  const sql = "INSERT INTO markalar (marka_adi, kategoriId) VALUES(?, ?)";
  db.query(sql, [marka_adi, kategoriId], (err, results) => {
    if (err) {
      console.log(err);
    }
    res.redirect("marka-listele");
  });
});

module.exports = router;
