const express = require("express");
const db = require("../Database");
const axios = require("axios");
const multer = require("multer");
const logger = require("../Logger/logger")
const FormData = require("form-data");

const app = express();
const upload = multer();
app.use(express.json());

const PORT = 3001;
const SERVICE = "UNITS";
const FS_SERVICE = "http://localhost:3003";
const offset = new Date().getTimezoneOffset() * 60000;


//Middleware для загрузки файла
const loader = (req, res, next) => {
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
    });
    axios.post(FS_SERVICE + "/upload", formData, {
        headers: {
            ...formData.getHeaders()
        }
    });
    
    next();
}

//Функция для получения имени файла
function getImgName(id, callback) {
    db.get(`SELECT img_name FROM units WHERE id = ?`, [id], (err, row) => {
        if (err) {
            return callback(err, null);
        }
        callback(null, row ? row.img_name : null);
    });
}

//Добавить юнит
app.post("/add", logger(SERVICE), upload.single("image"), loader, (req, res) => {
    const stmt = db.prepare("INSERT INTO units (name, img_name, date) VALUES (?, ?, ?)");
    stmt.run(req.body.name, req.file.originalname, new Date(Date.now() - offset).toISOString());
    stmt.finalize();

    res.send(req.body.name + " успешно добавлен.")
});

//Получить все юниты
app.get("/units", logger(SERVICE), (req, res) => {
    db.all("SELECT * FROM units", (err, rows) => {
        res.json(rows);
    });
});

//Получить юнит по id
app.get("/unit/:id", logger(SERVICE), (req, res) => {
    db.get("SELECT * FROM units WHERE id = ?", [req.params.id], (err, row) => {
        if (err) {
            res.status(404).send("Такой unit не существует.");
            return;
        }
        res.json(row);
    });
});

//Обновить юнит по id
app.put("/unit/:id", logger(SERVICE), upload.single("image"), loader, (req, res) => {
    getImgName(req.params.id, (err, img_name) => {
        if (err) {
            res.status(404).send("Такой unit не существует.");
            return;
        }
        axios.delete(FS_SERVICE + "/" + img_name).then( (response) => {
            if (response.status == 404) {
                res.send(response.data);
                return;
            }
        });
    })

    const stmt = "UPDATE units SET name = ?, img_name = ?, date = ? WHERE id = ?";
    db.run(stmt, [req.body.name, req.file.originalname, new Date(Date.now() - offset).toISOString(), req.params.id], (err) => {
        if (err) {
            res.status(404).send("Такой unit не существует.");
            return;
        }
    });

    res.send(req.body.name + "успешно обновлен.");
});

//Удалить юнит по id
app.delete("/unit/:id", logger(SERVICE), (req, res) => {
    getImgName(req.params.id, (err, img_name) => {
        if (err) {
            res.status(404).send("Такой unit не существует.");
            return;
        }
        axios.delete(FS_SERVICE + "/" + img_name).then( (response) => {
            if (response.status == 404) {
                res.send(response.data);
                return;
            }
        });
    })

    const stmt = `DELETE FROM units WHERE id = ${req.params.id}`;
    db.run(stmt, (err) => {
        res.status(404).send("Такой unit не существует.");
        return;
    });

    res.send("unit: " + req.params.id + "успешно удален.");
});

app.listen(PORT);
