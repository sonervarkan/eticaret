const express = require('express');
const app = express();
const path = require('path');
const db = require('./utility/database');
const session = require('express-session');
// Brevo user: 8b7fd6002@smtp-brevo.com
// brevo SMTP Key Value: ryzBR4vNZI1JE06T
// gmail uygulama şifresi: vbsu mykc ngst sszn

// Oturum middleware'ini ekle
app.use(
    session({
      secret: 'JH8w7eh@#4H9n2!9anDKw$X2nZ', // Oturum verilerini şifrelemek için kullanılır
      resave: false,
      saveUninitialized: false,
      cookie: { maxAge: 1000 * 60 * 60 * 2}  // 2 saat boyunca geçerli olsun }
    })
  );

// Body-parser middleware'leri
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // req.body boş gelmesin ve 
                                                // POST body okuyabilmek için

// views dizinini ve template engine'i ayarla
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));
  
// Statik dosyalar
app.use(express.static(path.join(__dirname, 'public')));

// Route'lar
const adminRouter = require('./routes/admin');
app.use(adminRouter);

const musteriUyeOlRouter = require('./routes/musteri-uye-ol');
app.use(musteriUyeOlRouter);

const musteriLoginRouter = require('./routes/musteri-login');
app.use(musteriLoginRouter);

const musteriLogoutRouter = require('./routes/musteri-logout');
app.use(musteriLogoutRouter);

const musteriListeleRouter = require('./routes/musteri-listele');
app.use(musteriListeleRouter);

const musteriGuncelleRouter = require('./routes/musteri-guncelle');
app.use(musteriGuncelleRouter);

const urunlerRouter = require('./routes/urunler'); // Yeni eklenen route
app.use(urunlerRouter);

const sepetRouter = require('./routes/sepet');
app.use(sepetRouter);

const kayitliSiparisVerRouter = require('./routes/kayitli-siparis-ver');
app.use(kayitliSiparisVerRouter);

const kayitsizSiparisVerRouter = require('./routes/kayitsiz-siparis-ver');
app.use(kayitsizSiparisVerRouter);

const kayitliOdemeRouter = require('./routes/kayitli-odeme');
app.use(kayitliOdemeRouter);

const kayitsizOdemeRouter = require('./routes/kayitsiz-odeme');
app.use(kayitsizOdemeRouter);

const urunEkleRouter = require('./routes/urun-ekle');
app.use(urunEkleRouter);

const urunListesiRouter = require('./routes/urun-listele');
app.use(urunListesiRouter);

const urunSorgulaRouter = require('./routes/urun-sorgula');
app.use(urunSorgulaRouter);

const urunGuncelleRouter = require('./routes/urun-guncelle');
app.use(urunGuncelleRouter);

const urunSilRouter = require('./routes/urun-sil');
app.use(urunSilRouter);

const siparisArsivRouter = require("./routes/siparis-arsiv");
app.use(siparisArsivRouter);

const tumListelerRouter=require("./routes/tum-listeler");
app.use(tumListelerRouter);

const tumSorgularRouter=require("./routes/tum-sorgular");
app.use(tumSorgularRouter);

const tumEklelerRouter=require("./routes/tum-ekleler");
app.use(tumEklelerRouter);

const tedarikciEkleRouter=require("./routes/tedarikci-ekle");
app.use(tedarikciEkleRouter);

const tedarikciListeleRouter=require("./routes/tedarikci-listele");
app.use(tedarikciListeleRouter);

const tedarikciGuncelleRouter=require("./routes/tedarikci-guncelle");
app.use(tedarikciGuncelleRouter);

const tedarikciSorgulaRouter=require("./routes/tedarikci-sorgula");
app.use(tedarikciSorgulaRouter);

const tedarikciSilRouter=require("./routes/tedarikci-sil");
app.use(tedarikciSilRouter);

const kategorilerRouter=require("./routes/kategoriler");
app.use(kategorilerRouter);

const markaEkleRouter=require("./routes/marka-ekle");
app.use(markaEkleRouter);

const markaListeleRouter=require("./routes/marka-listele");
app.use(markaListeleRouter);

const markaGuncelleRouter=require("./routes/marka-guncelle");
app.use(markaGuncelleRouter);

const modelEkleRouter=require("./routes/model-ekle");
app.use(modelEkleRouter);

const modelListeleRouter=require("./routes/model-listele");
app.use(modelListeleRouter);

const modelGuncelleRouter=require("./routes/model-guncelle");
app.use(modelGuncelleRouter);

const silRouter=require("./routes/sil");
app.use(silRouter);

const hakkimizdaRouter=require("./routes/hakkimizda");
app.use(hakkimizdaRouter);

const iletisimRouter=require("./routes/iletisim");
app.use(iletisimRouter);

const resimGorRouter=require("./routes/resim-gor");
app.use(resimGorRouter);    

// Sayaç değişkeni
let visitorCount = 0;


app.get('/', (req, res) => {
    // Kullanıcı daha önce ziyaret etti mi kontrol et
    if (!req.session.visited) {
        req.session.visited = true;
        visitorCount++;
    }

// slider ile tüm ürünleri gösterme menüsü
    const sqlUrunGetir = `
    SELECT 
        u.urun_id,
        CASE 
            WHEN u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0 THEN u.indirimli_fiyat
            ELSE u.urun_fiyati
            END AS urun_fiyati,
            u.urun_resim_url,
            u.urun_aciklama,
            u.indirimli_fiyat, 
            m.marka_adi,
            mo.model_adi
        FROM urunler u
        JOIN marka_model_hareket mmh ON (mmh.mmh_id=u.mmhId)
        JOIN markalar m ON m.marka_id = mmh.markaId
        JOIN modeller mo ON mo.model_id = mmh.modelId
        `;

    db.query(sqlUrunGetir, (err, resultsUrunGetir) => {
        if (err) {
            console.log(err);
            return res.status(500).send('Veritabanı hatası');
        }

// Bayram indirimi menüsü
        const sqlIndirimliUrunGetir = `
        SELECT 
            u.urun_id,
            u.indirimli_fiyat as urun_fiyati,
            u.urun_resim_url,
            u.urun_aciklama,
            u.indirimli_fiyat, 
            m.marka_adi,
            mo.model_adi
            FROM urunler u
            JOIN marka_model_hareket mmh ON (mmh.mmh_id=u.mmhId)
            JOIN markalar m ON m.marka_id = mmh.markaId
            JOIN modeller mo ON mo.model_id = mmh.modelId
            WHERE u.indirimli_fiyat IS NOT NULL AND u.indirimli_fiyat > 0
            `;

        db.query(sqlIndirimliUrunGetir, (err, resultsIndirimliUrun) => {
            if (err) {
                console.log(err);
                return res.status(500).send('Veritabanı hatası');
            }

// Sol taraftaki açılır kategoriler menüsü
            const sqlKategoriler = `
            SELECT 
                kategori_id, 
                kategori_adi
            FROM kategoriler
            ORDER BY kategori_adi ASC
            `;

            db.query(sqlKategoriler, (err, resultsKategoriler) => {
                if (err) {
                    console.log(err);
                    resultsKategoriler = [];
                }

                // Marka sorgusu (tüm markaları önceden çekiyoruz)
                const sqlMarkalar = `
                SELECT 
                    marka_id,
                    marka_adi,
                    kategoriId
                FROM markalar
                ORDER BY marka_adi ASC
                `;

                db.query(sqlMarkalar, (err, resultsMarkalar) => {
                    if (err) {
                        console.log(err);
                        resultsMarkalar = [];
                    }

                    // Kategorilere markaları ekleyelim
                    const kategorilerWithMarkalar = resultsKategoriler.map(kategori => {
                        return {
                            ...kategori,
                            markalar: resultsMarkalar.filter(marka => marka.kategoriId == kategori.kategori_id)
                        };
                    });
                    // Avantajlı ürünler 
                    const sqlAvantaj="select * from urunler where urun_fiyati<2000";
                    db.query(sqlAvantaj,(err,resultAvantaj)=>{
                        if(err){console.log(err);}
                        res.render("index", {
                            urunler: resultsUrunGetir, // slider ile tüm ürünleri gösterme menüsü
                            indirimliUrunler: resultsIndirimliUrun, // Bayram indirimi menüsü
                            kategoriler: kategorilerWithMarkalar, // Açılır kategoriler menüsü
                            avantajliUrunler:resultAvantaj,
                            musteri: req.session.musteri,
                            visitorCount: visitorCount
                        });
                    
                    });
                });
            });
        });
    });
});

// Markalar için API endpoint'i
app.get('/api/markalar', (req, res) => {
    const kategoriId = req.query.kategoriId;
    
    const sql = `
        SELECT marka_id, marka_adi 
        FROM markalar 
        WHERE kategoriId = ?
        ORDER BY marka_adi ASC
    `;
    
    db.query(sql, [kategoriId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});

// Modeller için API endpoint'i
app.get('/api/modeller', (req, res) => {
    const markaId = req.query.markaId;
    
    const sql = `
        SELECT model_id, model_adi 
        FROM modeller mo 
        JOIN marka_model_hareket mmh ON mo.model_id = mmh.modelId
        JOIN markalar m ON mmh.markaId = m.marka_id
        WHERE mmh.markaId = ?
        ORDER BY model_adi ASC
    `;
    
    db.query(sql, [markaId], (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
});


// Sepete Ekleme Route'u
app.post("/sepet", async (req, res) => {
    const { urunId, adet } = req.body;
    
    
        // 1. Önce ürünün güncel fiyat bilgisini alalım
        const sql= `
        SELECT 
        CASE 
        WHEN indirimli_fiyat IS NOT NULL AND indirimli_fiyat > 0 
        THEN indirimli_fiyat 
        ELSE urun_fiyati 
        END AS fiyat 
        FROM urunler 
        WHERE urun_id = ?`;
        db.query(sql,[urunId],(err,resultsIndirim)=>{
            if(err){console.log(err);}
            // Sepette bu ürün var mı kontrol edelim
            const sql = `
            SELECT * FROM sepet 
            WHERE urun_id = ?`;
            db.query(sql,[urunId],(err,resultsUrunVarmi)=>{
                if(err){console.log(err);}

                if (results.length>0) {
                    // Eğer ürün sepette varsa SADECE adeti güncelle
                    const sql= `
                    UPDATE sepet 
                    SET adet = adet + ? 
                    WHERE urun_id = ?`;
                    db.query(sql,[adet, urunId],(err,resultsAdet)=>{
                        if(err){console.log(err);}
                    });
                }else {
                    // Ürün sepette yoksa yeni kayıt ekle
                    if(req.session.musteri.musteri_id){
                        const sql=`
                        INSERT INTO sepet 
                        (musteri_id, urun_id, adet, fiyat, eklenme_tarihi) 
                        VALUES (?, ?, ?, ?, NOW())`;
                        
                        db.query(sql,[req.session.musteri.musteri_id,urunId, adet, urun.fiyat],(err,results)=>{
                                if(err){console.log(err);}
                        });
                    }else{
                        const sql=`
                        INSERT INTO sepet 
                        (musteri_id, urun_id, adet, fiyat, eklenme_tarihi) 
                        VALUES (?, ?, ?, ?, NOW())`;
                        
                        db.query(sql,[NULL,urunId, adet, urun.fiyat],(err,results)=>{
                                if(err){console.log(err);}
                                res.redirect("/kategoriler?success=Ürün sepete eklendi");
                        });
                    } 
                }

            });

        });
  
});

// Sunucuyu başlat
app.listen(3000, () => {
    console.log('Server Çalışıyor');
});