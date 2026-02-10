const {prisma} = require('../config/db.js');
const bcrypt = require ("bcryptjs");
const generateToken = require ('../utils/generateToken.js')
const register = async(req, res) => {
    const {name, email, password} = req.body;

    //létezik?
    const userexists = await prisma.user.findUnique({
        where: {email: email}, 
    });

    if (userexists) {
        return res.status(400).json({error: "Létezik már felhasználó ezzel az e-mail címmel."});
    }

    //psw hash
    const salt = await bcrypt.genSalt(10)
    const hashedpassword = await bcrypt.hash(password, salt);

    //create user
    const user = await prisma.user.create({ 
        data: {
            name,
            email,
            password: hashedpassword,
        },
    });
    //token
    const token = generateToken(user.id, res);

    res.cookie("userName", user.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.redirect('/website0.html');
};

const login = async (req, res) => {
    const {email, password} = req.body

    //check if exist
    const userexists = await prisma.user.findUnique({
        where: {email: email},
    });

if (!userexists) {
    return res
    .status(401).json({error: "Hibás email vagy jelszó!"});
    }

    //verify psw
    const validpass = await bcrypt.compare(password, userexists.password)

    if (!validpass)
    {
        return res.status(401).json({error: "Hibás email vagy jelszó!"});
    }

    //jwt token
    const token = generateToken(userexists.id, res);

    res.cookie("userName", userexists.name, {
        httpOnly: false,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
    });

    res.redirect('/website0.html');
};

const logout = async (req, res) => {
    res.cookie("jwt", "", {
        httpOnly: "true",
        expires: new Date(0)
    })
    res.status(200).json({
        status: "success",
        message: "Kilépés sikeres",
    });
};


module.exports = { login, register, logout}