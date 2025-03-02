const express = require("express");
const multer = require("multer");
const fs = require("fs");
const logger = require("../Logger/logger");

const app = express();
app.use(express.json());

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads");
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});
const upload = multer({storage});

const PORT = 3003;
const SERVICE = "FILE_STORAGE";

const validate = (req, res, next) => {
    const filePath = "uploads/" + req.params.name;

    if (!fs.existsSync(filePath)) {
        res.status(404).send("Файл не найден.");
        return;
    }

    next();
}

app.use(logger(SERVICE));

//Загрузить файл
app.post("/upload", upload.single("image"), (req, res) => {
    res.send(req.file.originalname + "успешно загружен.");
});

//Удалить файл
app.delete("/:name", validate, (req, res) => {
    fs.unlink("uploads/" + req.params.name, (err) => {
        if (err) {
            res.status(500).send("Ошибка при удалении файла.");
            return;
        }
        else {
            res.send("Файл: " + req.params.name + "успешно удален.")
        }
    });
});


//Получить файл
app.get("/:name", validate, (req, res) => {
    fs.readFile("uploads/" + req.params.name, (err, data) => {
        res.setHeader('Content-Type', 'image/jpg');
        res.send(data);
    });
});

app.listen(PORT);