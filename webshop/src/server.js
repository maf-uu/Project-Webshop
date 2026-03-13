const express = require("express");
const path = require("path");
const { config } = require("dotenv");
const { connectDB, disconnectDB, prisma } = require("./config/db.js");
const nodemailer = require("nodemailer");
const jwt = require('jsonwebtoken');

// Create a transporter using Ethereal test credentials.
// For production, replace with your actual SMTP server details.
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // Use true for port 465, false for port 587
  auth: {
    user: "eisen.shop.reply@gmail.com",
    pass: "jn7jnAPss4f63QBp6D",
  },
});

const getTokenFromRequest = (req) => {
    if (req.cookies && req.cookies.jwt) return req.cookies.jwt;
    if (req.headers && req.headers.authorization) {
        const parts = req.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
    }

    const cookieHeader = req.headers && req.headers.cookie;
    if (cookieHeader) {
        const jwtCookie = cookieHeader
            .split(';')
            .map((c) => c.trim())
            .find((c) => c.startsWith('jwt='));

        if (jwtCookie) return jwtCookie.split('=')[1];
    }

    return null;
};


//multer
const multer = require("multer");
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }});
const upload = multer({ storage: storage });





//router import
const itemroutes = require("./routes/itemroutes.js");
const authroutes =require("./routes/authroutes.js");

config();
connectDB();

const app = express()
app.use(express.static('public'))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/website0.html'));
});

//Body parse 
app.use(express.json());
app.use(express.urlencoded({extended: true}));

app.post('/auth/send-test-email', async (req, res) => {
    try {
        const { contactType, message } = req.body || {};

        const token = getTokenFromRequest(req);
        if (!token) return res.status(401).json({ error: 'Not authenticated' });

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const userId = decoded && decoded.id;
        if (!userId) return res.status(400).json({ error: 'Invalid token payload' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true },
        });

        if (!user || !user.email) {
            return res.status(404).json({ error: 'User email not found' });
        }

        const safeContactType = String(contactType || 'INQUIRY').trim().toUpperCase();
        const safeMessage = String(message || '').trim();
        if (!safeMessage) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        const info = await transporter.sendMail({
            from: '"EisenShop" <maddison53@ethereal.email>',
            to: user.email,
            subject: `EisenShop Contact: ${safeContactType}`,
            text: `Hello ${user.name || ''},\n\nThank you for contacting us.\n\nType: ${safeContactType}\nIt will take us a while to read your message and respond, but thank you for your understanding.\n\nMessage: ${safeMessage}`,
            html: `<p>Hello ${user.name || ''},</p><p>Thank you for contacting us.</p><p><strong>Type:</strong> ${safeContactType}</p><p>It will take us a while to read your message and respond, but thank you for your understanding.</p><p><strong>Message:</strong><br>${safeMessage.replace(/\n/g, '<br>')}</p>`,
        });

        return res.status(200).json({
            status: 'success',
            message: `Contact email sent to ${user.email}`,
            messageId: info.messageId,
        });
    } catch (error) {
        console.error('Email send error:', error);
        return res.status(500).json({ error: 'Could not send email' });
    }
});


//API routes
app.use("/items", itemroutes) ;
app.use("/auth", authroutes);

app.get('/main', (req, res) => {
    res.json({message: "Hello World" });
});

const PORT = 3000
const server = app.listen(PORT, () => {
    console.log('This server is working on Port 3000 currently.')
});

//adatbázis connection error
process.on("unhandledRejection", (err) => {
    console.error("Unhandled Rejection:", err);
    server.close(async () => {
        await disconnectDB();
        process.exit(1);
    });
});
//Uncaught exception
process.on("uncaughtException", async (err) => {
    console.error("Uncaught Exception:", err);
    await disconnectDB();
    process.exit(1);
});
//Shutdown
process.on("SIGTERM", async () => {
    console.log("SIGTERM megkapva, shutting down rendesen");
    server.close(async () => {
        await disconnectDB();
        process.exit(0);
    });
});

//upload item
app.post('/api/upload',upload.single('file'), (req, res) => {
    res.json(req.file);
});


//http://localhost:3000/

//AUTH (login, sign up)
//ITEMS (items uploaded)
//USER (profile) 
