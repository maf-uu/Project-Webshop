const express = require("express");

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




module.exports = router;