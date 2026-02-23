const {prisma} = require('../config/db.js');
const bcrypt = require ("bcryptjs");
const jwt = require('jsonwebtoken');
const generateToken = require ('../utils/generateToken.js')
const register = async(req, res) => {
    // accept either `name` (full name) or `username` (form has both sometimes)
    const {name: fullname, username, email, password, phone, gender} = req.body;
    const name = fullname || username || "";

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
            username: username || name,
            email,
            password: hashedpassword,
            phone: phone || null,
            gender: gender || null,
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

const userDelete = async (req, res) => {
    try {
        const getToken = () => {
            if (req.cookies && req.cookies.jwt) return req.cookies.jwt;
            if (req.headers && req.headers.authorization) {
                const parts = req.headers.authorization.split(' ');
                if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
            }
            const cookieHeader = req.headers && req.headers.cookie;
            if (cookieHeader) {
                const jwtCookie = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('jwt='));
                if (jwtCookie) return jwtCookie.split('=')[1];
            }
            return null;
        };

        const token = getToken();
        console.log('[authcontrol] /auth/delete headers:', {
            cookie: req.headers && req.headers.cookie,
            authorization: req.headers && req.headers.authorization
        });
        console.log('[authcontrol] extracted token present:', !!token);
        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('[authcontrol] token decoded id:', decoded && decoded.id);
        } catch (e) {
            console.error('[authcontrol] token verify failed:', e && e.message);
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decoded && decoded.id;
        if (!userId) return res.status(400).json({ error: 'Invalid token payload' });

        // ensure user exists
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // fetus deletus
        await prisma.user.delete({ where: { id: userId } });

        // cookie clear kingdom
        if (res.clearCookie) {
            res.clearCookie('jwt');
            res.clearCookie('userName');
        } else {
            res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
            res.cookie('userName', '', { httpOnly: false, expires: new Date(0) });
        }

        return res.status(200).json({ status: 'success', message: 'Account deleted' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Could not delete account' });
    }
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


module.exports = { login, register, logout, userDelete, deleteAccount: userDelete }

//return info
const getCurrentUser = async (req, res) => {
    try {
        const getToken = () => {
            if (req.cookies && req.cookies.jwt) return req.cookies.jwt;
            if (req.headers && req.headers.authorization) {
                const parts = req.headers.authorization.split(' ');
                if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
            }
            const cookieHeader = req.headers && req.headers.cookie;
            if (cookieHeader) {
                const jwtCookie = cookieHeader.split(';').map(c => c.trim()).find(c => c.startsWith('jwt='));
                if (jwtCookie) return jwtCookie.split('=')[1];
            }
            return null;
        };

        const token = getToken();
        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decoded && decoded.id;
        if (!userId) return res.status(400).json({ error: 'Invalid token payload' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, username: true, email: true, phone: true, gender: true, createdAt: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        return res.json({
            id: user.id,
            fullname: user.name,
            username: user.username,
            email: user.email,
            phone: user.phone,
            gender: user.gender,
            createdAt: user.createdAt
        });
    } catch (err) {
        console.error('[authcontrol] getCurrentUser error:', err);
        return res.status(500).json({ error: 'Server error' });
    }
};

module.exports.getCurrentUser = getCurrentUser;