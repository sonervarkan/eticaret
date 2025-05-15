const express = require('express');
const router = express.Router();
const db = require('../utility/database');
const session = require('express-session');

// Oturum yönetimi middleware'i
router.use(session({
    secret: 'gizli_anahtar',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// Admin giriş sayfası
router.get('/admin-login', (req, res) => {
    res.render('admin-login');
});

// POST admin-login
router.post('/admin-login', (req, res) => {
  const { personel_adi, personel_sifre } = req.body;

  const query = 'SELECT * FROM admin WHERE personel_adi = ? AND personel_sifre = ?';
  db.query(query, [personel_adi, personel_sifre], (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      req.session.loggedIn = true;
      req.session.personel_adi = personel_adi;
      req.session.rolId = results[0].rolId;
      res.redirect('/admin-home-page'); // Giriş başarılıysa ana sayfaya yönlendir
    } else {
      res.send('Giriş başarısız!');
    }
  });
});



// Admin ana sayfası
router.get('/admin-home-page', (req, res) => {
    if (req.session.loggedIn) {
        res.render('admin-home-page', { personel_adi: req.session.personel_adi, rolId: req.session.rolId });
    } else {
        res.redirect('/admin-login');
    }
});

// Admin çıkış işlemi
router.post('/cikis', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect('/admin-login');
        }
    });
});


// Yetki kontrol endpoint'i
router.get('/check-admin-auth', (req, res) => {
    if (req.session.loggedIn && req.session.rolId === 1) {
      res.json({ isAuthorized: true });
    } else {
      res.json({ isAuthorized: false });
    }
  });
  
  // GET admin-kayit-ol route'u
  router.get('/admin-kayit-ol', (req, res) => { 
    if (req.session.loggedIn && req.session.rolId === 1) {
      res.render('admin-kayit-ol');
    } else {
      res.status(403).json({ error: 'Yetkiniz yok' });
    }
  });


router.post('/admin-kayit-ol', (req, res) => {
    if (req.session.loggedIn && req.session.rolId === 1) { // Sadece Yönetici kaydedebilir
        const { personel_adi, personel_sifre, rolId } = req.body;

        if (!personel_adi || !personel_sifre || !rolId) {
            return res.status(400).render('admin-kayit-ol', { error: 'Tüm alanlar zorunludur!' });
        }

        const query = 'INSERT INTO admin (personel_adi, personel_sifre, rolId) VALUES (?, ?, ?)';
        db.query(query, [personel_adi, personel_sifre, rolId], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).render('admin-kayit-ol', { error: 'Bir hata oluştu!' });
            }
            res.redirect('/admin-home-page');
        });
    } else {
        res.redirect('/admin-login');
    }
});
module.exports = router;