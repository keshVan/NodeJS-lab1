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

//Загрузить файл
app.post("/upload", upload.single("image"), logger(SERVICE), (req, res) => {
    res.send(req.file.originalname + "успешно загружен.");
});

//Удалить файл
app.delete("/:name", logger(SERVICE), validate, (req, res) => {
    fs.unlink("uploads/" + req.params.name, (err) => {
        res.status(500).send("Ошибка при удалении файла.");
        return;
    });
    res.send("Файл: " + req.params.name + "успешно удален.")
});


//Получить файл
app.get("/:name", logger(SERVICE), validate, (req, res) => {
    res.sendFile("uploads/" + req.params.name);
});

app.listen(PORT);