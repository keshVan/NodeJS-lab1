const sqlite = require('sqlite3').verbose();
const db = new sqlite.Database('Database/database.db', (error) => {
    if (error) {
        console.log("ошибка подключения");
    }
});

module.exports = db;
