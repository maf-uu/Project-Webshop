const { prisma } = require('../config/db.js');

const uploadItem = async (req, res) => {
    try {
        const { name, description, price, userid, createdBy } = req.body;

        // hiányzó adat?
        if (!name || !price || !userid || !createdBy) {
            return res.status(400).json({ error: "Név, ár, userid és createdBy mező kötelező." });
        }

        // item create
        const item = await prisma.items.create({
            data: {
                name,
                description: description || null,
                price: parseInt(price),
                userid,
                createdBy,
                filePath: req.file ? req.file.path : null,
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

module.exports = { uploadItem };
