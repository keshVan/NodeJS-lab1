const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const upload = multer();
const router = express.Router();
router.use(express.json());

const FS = "http://localhost:3003";

router.post("/", upload.single("file"), (req, res) => {
    const formData = new FormData();
    formData.append("file", req.file.buffer, {
        filename: req.file.originalname,
        contentType: req.file.mimetype
    });

    axios.post(FS + "/upload", formData, {
        headers: {
            ...formData.getHeaders()
        }
    }).then( (response) => {
        res.send(response.data);
    });
});

router.delete("/:name", (req, res) => {
    axios.delete(FS + "/" + req.params.name).then( (response) => {
        res.send(response.data);
    })
});

router.get("/:name", (req, res) => {
    axios.get(FS + "/" + req.params.name, {
        responseType: 'arraybuffer'
    }).then( (response) => {
        res.set('Content-Type', 'image/jpg');
        res.send(Buffer.from(response.data, 'binary'));
    });
});

module.exports = router;