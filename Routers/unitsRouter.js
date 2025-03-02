const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const upload = multer();
const router = express.Router();
router.use(express.json());

const UNITS = "http://localhost:3001";

//Middleware проверки корректного ввода данных
const validate = (req, res, next) => {
    const name = req.body.name;
    if (!name || name.length <= 4) {
        res.status(400).send("Имя дожно быть пустым и содержать более 4 символов.");
        return;
    }
    if (!req.file) {
        res.status(400).send("Изображение не должно быть пустым.");
        return;
    }

    next();
}

router.get("/", (req, res) => {
    axios.get(UNITS + "/units").then( (response) => {
        res.send(response.data);
    });
});

router.post("/", upload.single("image"), validate, (req, res) => {
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
    });
    formData.append("name", req.body.name);
    axios.post(UNITS + "/add", formData, {
        headers: {
            ...formData.getHeaders()
        }
    }).then( (response) => {
        res.send(response.data);
    });
});

router.get("/:id", (req, res) => {
    axios.get(UNITS + "/unit/" + req.params.id)
    .then( (response) => {
        res.send(response.data);
    })
    .catch( (err) => {
        if (err.response) {
            res.status(err.response.status).send(err.response.data);
        }
        else {
            res.status(500).send("Ошибка шлюза.");
        }
    });
});

router.put("/:id", upload.single("image"), validate, (req, res) => {
    const formData = new FormData();
    formData.append("image", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
    });
    formData.append("name", req.body.name);
    
    axios.put(UNITS + "/unit/" + req.params.id, formData, {
        headers: {
            ...formData.getHeaders()
        }
    }).then( (response) => {
        res.send(response.data);
    });
});

router.delete("/:id", (req, res) => {
    axios.delete(UNITS + "/unit/" + req.params.id).then( (response) => {
        res.send(response.data);
    });
});

module.exports = router;