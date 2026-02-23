const express = require("express");
const {login, register, logout, deleteAccount, getCurrentUser} = require('../routes/authcontrol.js')

const router = express.Router();

router.post("/register", register);

router.post("/login", login);

router.post("/logout", logout)

router.post("/delete", deleteAccount)

router.get('/user', getCurrentUser);

module.exports = router