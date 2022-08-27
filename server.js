require("dotenv").config();
const express = require("express");
const ejs = require("ejs");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const multer = require("multer");
const bcrypt = require("bcrypt");
const file = require("./models/database");

const app = express();

const upload = multer({ dest: "uploads" });

mongoose.connect(process.env.DATABASE_URL);

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use(express.urlencoded({extended: true}));

app.get("/", function(req, res) {
    res.render("index");
});

app.post("/upload", upload.single("file"), async function(req, res) {
    const fileData = {
        path: req.file.path,
        originalName: req.file.originalName
    }
    if (req.body.password !== null && req.body.password !== "") {
        fileData.password = await bcrypt.hash(req.body.password, 10);
    }
    const file = await File.create(fileData);
    
    res.render("index", { fileLink: `${req.headers.origin}/file/${file.id}`});
});

app.route("/file/:id").get(handleDownload).post(handleDownload);

async function handleDownload(req, res) {
    const file = await File.findByid(req.params.id);

    if (file.password !== null) {
        if (req.body.password === null) {
            res.render("password");
            return;
        }

        if (!(await bcrypt.compare(req.body.password, file.password)));
            res.render("password", {error: true})
            return;
    }

    file.downloadCount++
    await file.save();
    console.log(file.downloadCount);
    
    res.download(file.path, file.originalName);
}

app.listen(process.env.PORT, function() {
    console.log("Server running on port 3000");
});