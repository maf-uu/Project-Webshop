const express = require("express");
const {login, register, logout} = require('../routes/authcontrol.js')

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout)

module.exports = router