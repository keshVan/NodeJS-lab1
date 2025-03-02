const express = require("express");
const app = express();
const db = require("../Database");

const PORT = 3002;

app.use(express.json());

app.post("/log", (req, res) => {
    const stmt = db.prepare("INSERT INTO logs (service, start, method, url, end) VALUES (?, ?, ?, ?, ?)");
    stmt.run(req.body.service, req.body.start, req.body.method, req.body.url, req.body.end);
    stmt.finalize();
});


app.listen(PORT);
