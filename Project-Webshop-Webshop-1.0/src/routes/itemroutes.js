const express = require("express");
const multer = require("multer");
const { uploadItem, getitembyid, listitems } = require('./itemcontrol.js');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage: storage });

const router = express.Router();

router.get("/main", (req, res) => {
    res.json({httpMethod: "get"});
});
router.post("/main", (req, res) => {
    res.json({httpMethod: "post"});
});
router.put("/main", (req, res) => {
    res.json({httpMethod: "put"});
});
router.delete("/main", (req, res) => {
    res.json({httpMethod: "delete"});
});


router.post("/upload", upload.single('file'), uploadItem);

router.get("/", listitems);
router.get("/:id", getitembyid);

module.exports = router;