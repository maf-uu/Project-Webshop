const express = require("express");
const path = require("path");
const { config } = require("dotenv");
const { connectDB, disconnectDB } = require("./config/db.js");


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
