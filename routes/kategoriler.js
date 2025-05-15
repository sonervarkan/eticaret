// routes/kategoriler.js
const express = require('express');
const router = express.Router();
const db = require('../utility/database');

router.get('/kategoriler', (req, res) => {
    const { kategoriId, markaId, modelId } = req.query;
  
    // Dinamik WHERE koşulları ve parametre listesi
    let whereConditions = [];
    let params = [];
  
    if (kategoriId) {
        whereConditions.push('k.kategori_id = ?');
        params.push(kategoriId);
    }
    if (markaId) {
        whereConditions.push('m.marka_id = ?');
        params.push(markaId);
    }
    if (modelId) {
        whereConditions.push('mo.model_id = ?');
        params.push(modelId);
    }
  
    // Koşulları birleştir
    const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';
  
    // Ürün sorgusu
    const sqlUrunler = `
        SELECT 
            u.urun_id, 
            u.urun_aciklama, 
            u.urun_resim_url,
            CASE 
                WHEN u.indirimli_fiyat > 0 THEN u.indirimli_fiyat 
                ELSE u.urun_fiyati 
            END AS fiyat,
            m.marka_adi, 
            mo.model_adi, 
            k.kategori_adi,
            u.indirimli_fiyat, 
            u.urun_fiyati
        FROM urunler u
        JOIN marka_model_hareket mmh ON u.mmhId = mmh.mmh_id
        JOIN markalar m ON mmh.markaId = m.marka_id
        JOIN modeller mo ON mmh.modelId = mo.model_id
        JOIN kategoriler k ON m.kategoriId = k.kategori_id
        ${whereClause}
    `;
  
    db.query(sqlUrunler, params, (err, urunler) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Database error');
        }
  
        db.query('SELECT * FROM kategoriler ORDER BY kategori_adi ASC', (err, kategoriler) => {
            if (err) return res.status(500).send('Category query error');
  
            if (kategoriId) {
                db.query('SELECT * FROM markalar WHERE kategoriId = ? ORDER BY marka_adi ASC', [kategoriId], (err, markalar) => {
                    if (err) return res.status(500).send('Brand query error');
  
                    if (markaId) {
                        db.query(`
                            SELECT * FROM modeller mo
                            JOIN marka_model_hareket mmh ON mmh.modelId = mo.model_id 
                            JOIN markalar m ON m.marka_id = mmh.markaId
                            WHERE mmh.markaId = ? ORDER BY mo.model_adi ASC
                        `, [markaId], (err, modeller) => {
                            if (err) return res.status(500).send('Model query error');
  
                            const kategoriAdi = kategoriler.find(k => k.kategori_id == kategoriId)?.kategori_adi || '';
                            const markaAdi = markalar.find(m => m.marka_id == markaId)?.marka_adi || '';
                            const modelAdi = modeller.find(m => m.model_id == modelId)?.model_adi || '';
                            const title = [kategoriAdi, markaAdi, modelAdi].filter(Boolean).join(' > ') || 'Products';
  
                            res.render('kategoriler', {
                                title,
                                urunler,
                                kategoriler,
                                markalar,
                                modeller,
                                selected: { kategoriId, markaId, modelId },
                                musteri: req.session.musteri || null
                            });
                        });
                    } else {
                        res.render('kategoriler', {
                            title: 'Products',
                            urunler,
                            kategoriler,
                            markalar,
                            modeller: [],
                            selected: { kategoriId, markaId, modelId },
                            musteri: req.session.musteri || null
                        });
                    }
                });
            } else {
                res.render('kategoriler', {
                    title: 'Products',
                    urunler,
                    kategoriler,
                    markalar: [],
                    modeller: [],
                    selected: { kategoriId, markaId, modelId },
                    musteri: req.session.musteri || null
                });
            }
        });
    });
  });
  


// POST (ARAMA ÇUBUĞU)
router.post('/kategoriler', (req, res) => {
    const search = req.body.search;
    

    const sql = `
        SELECT 
            u.urun_id, u.urun_aciklama, u.urun_resim_url,
            CASE WHEN u.indirimli_fiyat > 0 THEN u.indirimli_fiyat 
            ELSE u.urun_fiyati 
            END AS fiyat,
            m.marka_adi, 
            mo.model_adi, 
            k.kategori_adi,
            u.indirimli_fiyat, 
            u.urun_fiyati
        FROM urunler u
        JOIN marka_model_hareket mmh ON mmh.mmh_id = u.mmhId
        JOIN markalar m ON m.marka_id = mmh.markaId
        JOIN modeller mo ON mo.model_id = mmh.modelId
        JOIN kategoriler k ON k.kategori_id = m.kategoriId
        WHERE k.kategori_adi LIKE ? 
        OR m.marka_adi LIKE ? 
        OR mo.model_adi LIKE ?
    `;
    
    const searchTerm = `%${search}%`;
    
    db.query(sql, [searchTerm, searchTerm, searchTerm], (err, urunler) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Veritabanı hatası');
        }
        
        // Kategorileri de getir (sidebar için)
        db.query('SELECT * FROM kategoriler ORDER BY kategori_adi ASC', (err, kategoriler) => {
            if (err) return res.status(500).send('Kategori sorgusu hatası');
            
            res.render('kategoriler', {
                title: `"${search}" Arama Sonuçları`,
                urunler,
                kategoriler,
                markalar: [],
                modeller: [],
                selected: {},
                musteri: req.session.musteri || null
            });
        });
    });
});

module.exports = router;