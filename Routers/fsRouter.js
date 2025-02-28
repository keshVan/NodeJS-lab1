const express = require("express");
const axios = require("axios");
const multer = require("multer");
const FormData = require("form-data");

const upload = multer();
const router = express.Router();
router.use(express.json());

const FS = "http://localhost:3003";

router.post("/upload", upload.single("file"), (req, res) => {
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

router.delete("/delete/:name", (req, res) => {
    axios.delete(FS + "/" + req.params.name).then( (response) => {
        res.send(response.data);
    })
});

router.get("/get/:name", (req, res) => {
    axios.get(FS + "/" + req.params.name).then( (response) => {
        res.send(response.data);
    });
});

module.exports = router;