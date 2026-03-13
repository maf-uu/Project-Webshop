const { prisma } = require('../config/db.js');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs/promises');

const CART_COOKIE_NAME = 'cartItems';

const getCookieValue = (req, cookieName) => {
    const cookieHeader = req.headers && req.headers.cookie;
    if (!cookieHeader) return null;

    const cookie = cookieHeader
        .split(';')
        .map((value) => value.trim())
        .find((value) => value.startsWith(`${cookieName}=`));

    if (!cookie) return null;
    const rawValue = cookie.substring(cookieName.length + 1);

    try {
        return decodeURIComponent(rawValue);
    } catch (error) {
        return rawValue;
    }
};

const readCartItemsFromCookie = (req) => {
    const rawCart = getCookieValue(req, CART_COOKIE_NAME);
    if (!rawCart) return [];

    try {
        const parsed = JSON.parse(rawCart);
        if (!Array.isArray(parsed)) return [];
        const normalized = parsed.filter((itemId) => typeof itemId === 'string' || typeof itemId === 'number');

        // Keep one entry per item ID to enforce a unique-item cart.
        const seen = new Set();
        const unique = [];

        for (const itemId of normalized) {
            const key = String(itemId);
            if (seen.has(key)) continue;
            seen.add(key);
            unique.push(itemId);
        }

        return unique;
    } catch (error) {
        return [];
    }
};

const setCartCookie = (res, cartItems) => {
    res.cookie(CART_COOKIE_NAME, JSON.stringify(cartItems), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: (1000 * 60 * 60 * 24) * 7,
    });
};

const sanitizeCartItems = async (cartItems) => {
    if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return [];
    }

    const uniqueItemIds = [...new Set(cartItems.map((itemId) => String(itemId)))];

    const availableItems = await prisma.items.findMany({
        where: {
            id: { in: uniqueItemIds },
            itemstatus: 'ELADO',
        },
        select: { id: true },
    });

    const availableItemIdSet = new Set(availableItems.map((item) => String(item.id)));
    return cartItems.filter((itemId) => availableItemIdSet.has(String(itemId)));
};

const VALID_ITEM_TYPES = [
    'AUTOMOTIVE',
    'BEAUTY',
    'BOOKS',
    'CLOTHING',
    'ELECTRONICS',
    'COLLECTIBLES',
    'FURNITURE',
    'GARDENING',
    'JEWELRY',
    'MUSIC',
    'PET_SUPPLIES',
    'SPORTS',
    'TOYS',
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const deleteFileSafely = async (filePath, maxAttempts = 3) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            await fs.unlink(filePath);
            return;
        } catch (error) {
            const isLastAttempt = attempt === maxAttempts;
            const isRetriable = error && (error.code === 'EBUSY' || error.code === 'EPERM');
            const isMissing = error && error.code === 'ENOENT';

            if (isMissing) {
                return;
            }

            if (isRetriable && !isLastAttempt) {
                await sleep(100 * attempt);
                continue;
            }

            console.warn('Could not delete original uploaded file:', filePath, error.message);
            return;
        }
    }
};

const uploadItem = async (req, res) => {
    try {
        const { name, description, price, userid, createdBy, itemType } = req.body;

        // basic validation – itemType is required by the Prisma schema
        if (!name || !price || !userid || !createdBy || !itemType) {
            return res.status(400).json({ error: "Név, ár, userid, createdBy és itemType mezők kötelezőek." });
        }

        let filePath = null;

        if (req.file) {
            const originalPath = req.file.path;
            const parsedName = path.parse(req.file.filename);
            const resizedFilename = `${parsedName.name}-resized.jpg`;
            const resizedPath = path.join(path.dirname(originalPath), resizedFilename);

            await sharp(originalPath)
                .rotate()
                .resize(600, 800, {
                    fit: 'cover',
                    withoutEnlargement: true,
                })
                .jpeg({ quality: 80 })
                .toFile(resizedPath);

            await deleteFileSafely(originalPath);
            filePath = `/uploads/${resizedFilename}`;
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
                filePath,
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
        const {
            itemType,
            search,
            uploadDate,
            dateOrder,
            minPrice,
            maxPrice,
            includeSold,
        } = req.query;

        const where = {};
        const andFilters = [];
        const shouldIncludeSold = includeSold && includeSold.toString().trim().toLowerCase() === 'true';

        if (!shouldIncludeSold) {
            where.itemstatus = 'ELADO';
        }

        if (itemType) {
            const normalizedItemType = itemType.toString().trim().toUpperCase();

            if (!VALID_ITEM_TYPES.includes(normalizedItemType)) {
                return res.status(400).json({
                    error: "Érvénytelen itemType.",
                    validItemTypes: VALID_ITEM_TYPES,
                });
            }

            where.itemType = normalizedItemType;
        }

        if (search && search.toString().trim() !== '') {
            const searchText = search.toString().trim();
            andFilters.push({
                OR: [
                    { name: { contains: searchText, mode: 'insensitive' } },
                    { description: { contains: searchText, mode: 'insensitive' } },
                ],
            });
        }

        if (uploadDate) {
            const normalizedUploadDate = uploadDate.toString().trim().toLowerCase();
            const now = Date.now();
            let fromDate = null;

            if (normalizedUploadDate === '24h') {
                fromDate = new Date(now - (24 * 60 * 60 * 1000));
            } else if (normalizedUploadDate === '7d') {
                fromDate = new Date(now - (7 * 24 * 60 * 60 * 1000));
            } else if (normalizedUploadDate === '30d') {
                fromDate = new Date(now - (30 * 24 * 60 * 60 * 1000));
            }

            if (fromDate) {
                andFilters.push({ createdAt: { gte: fromDate } });
            }
        }

        if (minPrice !== undefined && minPrice !== null && minPrice !== '') {
            const parsedMinPrice = Number(minPrice);
            if (!Number.isFinite(parsedMinPrice)) {
                return res.status(400).json({ error: 'Invalid minPrice.' });
            }

            andFilters.push({ price: { gte: Math.floor(parsedMinPrice) } });
        }

        if (maxPrice !== undefined && maxPrice !== null && maxPrice !== '') {
            const parsedMaxPrice = Number(maxPrice);
            if (!Number.isFinite(parsedMaxPrice)) {
                return res.status(400).json({ error: 'Invalid maxPrice.' });
            }

            andFilters.push({ price: { lte: Math.floor(parsedMaxPrice) } });
        }

        if (andFilters.length > 0) {
            where.AND = andFilters;
        }

        const normalizedDateOrder = dateOrder && dateOrder.toString().trim().toLowerCase() === 'oldest'
            ? 'asc'
            : 'desc';

        const items = await prisma.items.findMany({
            where,
            orderBy: { createdAt: normalizedDateOrder },
        });

        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Hiba történt az elemek listázánál." });
    }
};

const listitemsByType = async (req, res) => {
    try {
        const { itemType } = req.params;
        const normalizedItemType = itemType.toString().trim().toUpperCase();

        if (!VALID_ITEM_TYPES.includes(normalizedItemType)) {
            return res.status(400).json({
                error: "Érvénytelen tárgy típus.",
                validItemTypes: VALID_ITEM_TYPES,
            });
        }

        const items = await prisma.items.findMany({
            where: { itemType: normalizedItemType },
        });

        res.json(items);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Hiba történt az elemek szűrése közben." });
    }
};

const getCartItems = async (req, res) => {
    const rawCartItems = readCartItemsFromCookie(req);
    const cartItems = await sanitizeCartItems(rawCartItems);

    if (cartItems.length !== rawCartItems.length) {
        setCartCookie(res, cartItems);
    }

    return res.json({
        status: 'success',
        cartItems,
        count: cartItems.length,
    });
};

const addItemToCart = async (req, res) => {
    const { itemId } = req.body;
    if (!itemId) {
        return res.status(400).json({ error: 'itemId is required.' });
    }

    const rawCartItems = readCartItemsFromCookie(req);
    const cartItems = await sanitizeCartItems(rawCartItems);

    const itemToAdd = await prisma.items.findUnique({
        where: { id: String(itemId) },
        select: { id: true, itemstatus: true },
    });

    if (!itemToAdd || itemToAdd.itemstatus !== 'ELADO') {
        setCartCookie(res, cartItems);
        return res.status(400).json({ error: 'This item is no longer available.' });
    }

    const alreadyInCart = cartItems.some((existingId) => String(existingId) === String(itemId));
    if (!alreadyInCart) {
        cartItems.push(itemId);
    }

    setCartCookie(res, cartItems);

    return res.json({
        status: 'success',
        alreadyInCart,
        cartItems,
        count: cartItems.length,
    });
};

const removeItemFromCart = async (req, res) => {
    const { itemId } = req.body;
    const rawCartItems = readCartItemsFromCookie(req);
    const cartItems = await sanitizeCartItems(rawCartItems);

    if (cartItems.length === 0) {
        setCartCookie(res, []);
        return res.json({
            status: 'success',
            cartItems,
            count: 0,
        });
    }

    if (itemId === undefined || itemId === null || itemId === '') {
        cartItems.pop();
    } else {
        const index = cartItems.findIndex((existingId) => String(existingId) === String(itemId));
        if (index !== -1) {
            cartItems.splice(index, 1);
        }
    }

    setCartCookie(res, cartItems);

    return res.json({
        status: 'success',
        cartItems,
        count: cartItems.length,
    });
};

const checkoutCartItems = async (req, res) => {
    try {
        const rawCartItems = readCartItemsFromCookie(req);
        const cartItems = await sanitizeCartItems(rawCartItems);

        if (cartItems.length !== rawCartItems.length) {
            setCartCookie(res, cartItems);
        }

        if (cartItems.length === 0) {
            return res.status(400).json({ error: 'Cart is empty.' });
        }

        const uniqueItemIds = [...new Set(cartItems.map((itemId) => String(itemId)))];

        const updateResult = await prisma.items.updateMany({
            where: {
                id: {
                    in: uniqueItemIds,
                },
            },
            data: {
                itemstatus: 'ELADVA',
            },
        });

        setCartCookie(res, []);

        return res.json({
            status: 'success',
            deletedCount: updateResult.count,
            updatedCount: updateResult.count,
            checkedOutItemIds: uniqueItemIds,
            cartItems: [],
            count: 0,
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return res.status(500).json({ error: 'Checkout failed.' });
    }
};

module.exports = { uploadItem, getitembyid, listitems, listitemsByType,
     getCartItems, addItemToCart, removeItemFromCart, checkoutCartItems };
