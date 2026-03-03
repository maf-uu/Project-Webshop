const { prisma } = require('../config/db.js');

const uploadItem = async (req, res) => {
    try {
        const { name, description, price, userid, createdBy, itemType } = req.body;

        // basic validation – itemType is required by the Prisma schema
        if (!name || !price || !userid || !createdBy || !itemType) {
            return res.status(400).json({ error: "Név, ár, userid, createdBy és itemType mezők kötelezőek." });
        }

        // item create
        const item = await prisma.items.create({
            data: {
                name,
                description: description || null,
                price: parseInt(price),
                userid,
                createdBy,
                itemType,
                filePath: req.file ? `/uploads/${req.file.filename}` : null,
            },
        });

        // success response
        const response = {
            status: "success",
            message: "Elem sikeresen feltöltve.",
            item: item,
        };

        res.status(201).json(response);
    } catch (error) {
        console.error("Item upload error:", error);
        res.status(500).json({ error: "Hiba történt az elem feltöltésekor." });
    }
};

const getitembyid = async (req, res) => {
    try {
        const { id } = req.params;
        const item = await prisma.items.findUnique({ where: { id } });
        if (!item) return res.status(404).json({ error: "Elem nem található." });
        res.json(item);
    } catch (error) {
        console.error(err);
        res.status(500).json({ error: "Hiba volt a lekérés közben." });
    }
};

const listitems = async (req, res) => {
    try {
        const items = await prisma.items.findMany();
        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Hiba történt az elemek listázánál." });
    }
};

module.exports = { uploadItem, getitembyid, listitems };
