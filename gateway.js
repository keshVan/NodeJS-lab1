const express = require("express");
const unitsRouter = require("./Routers/unitsRouter");
const fsRouter = require("./Routers/fsRouter");
const app = express();
const PORT = 3000;

app.use("/units", unitsRouter);
app.use("/fs", fsRouter);

app.listen(PORT);