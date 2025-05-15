const mysql = require('mysql2');

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '1234',
    database: 'webprogramlamaeticaret'
});

conn.connect((err) => {
    if (err) {
        console.log("MySQL bağlantı hatası:", err);
    } else {
        console.log("MySQL bağlantısı başarılı!");
    }
});

module.exports = conn;