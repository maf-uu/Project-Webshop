function showsection(name) {
    const sections = document.querySelectorAll('.section');

    closeSearchFilter();

    sections.forEach(sec => {
        sec.classList.add("hidden");
    });

    const active = document.getElementById(name);
    active.classList.remove("hidden");

    if (name === 'cart') {
        loadCartItemsView();
    }
}

function goToFrontPage() {
    showsection('about');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showSearchFilter() {
    const browsingContainer = document.querySelector('.browsingContainer');
    const trigger = document.querySelector('.searchfilterpng');
    if (!browsingContainer || !trigger) return;

    browsingContainer.classList.toggle('active');
    trigger.classList.toggle('active');
    document.body.classList.toggle('no-scroll');
}

function closeSearchFilter() {
    const browsingContainer = document.querySelector('.browsingContainer');
    const trigger = document.querySelector('.searchfilterpng');
    if (!browsingContainer || !trigger) return;

    browsingContainer.classList.remove('active');
    trigger.classList.remove('active');
    document.body.classList.remove('no-scroll');
}

// Display username everywhere on page load
function displayUsername() {
    const cookies = document.cookie.split(';');
    let userName = 'Guest User';

    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'userName') {
            userName = decodeURIComponent(value);
            break;
        }
    }

    const usernameElements = document.querySelectorAll('.usernameText')

    usernameElements.forEach(function(el) {
        el.textContent = userName;
    });
}

// Handle account button click - shows account section when logged in, otherwise go to register
function handleAccountClick() {
    const cookies = document.cookie.split(';');
    let isLoggedIn = false;

    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'userName') {
            isLoggedIn = true;
            break;
        }
    }

    if (isLoggedIn) {
        showsection('account');
    } else {
        // User is not logged in, go to register page
        window.location.href = '/register.html';
    }
}

function handleUploadClick() {
    const cookies = document.cookie.split(';');
    let isLoggedIn = false;

    for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'userName') {
            isLoggedIn = true;
            break;
        }
    }

    if (isLoggedIn) {
        showsection('upload');
        attachUploadHandler();
    } else {
        // User is not logged in, go to register page
        window.location.href = '/register.html';
    }
}

let _uploadHandlerAttached = false;
let _contactHandlerAttached = false;

function attachUploadHandler() {
    if (_uploadHandlerAttached) return;
    const form = document.getElementById('uploaditem');
    if (!form) return;
    form.addEventListener('submit', submitUpload);
    _uploadHandlerAttached = true;
}

function attachContactHandler() {
    if (_contactHandlerAttached) return;
    const form = document.getElementById('contactEisen');
    if (!form) return;
    form.addEventListener('submit', submitContactForm);
    _contactHandlerAttached = true;
}

async function submitContactForm(event) {
    event.preventDefault();

    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
        const formData = new FormData(form);
        const contactType = String(formData.get('contactType') || 'INQUIRY').trim().toUpperCase();
        const message = String(formData.get('description') || '').trim();

        const resp = await fetch('/auth/send-test-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ contactType, message })
        });

        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
            const errMsg = data && data.error ? data.error : 'Could not send contact email.';
            alert(errMsg);
            return;
        }

        alert('Your message was sent to your email.');
        form.reset();
    } catch (error) {
        console.error('Contact form submit failed:', error);
        alert('Could not send contact email. Please try again.');
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

let marketplaceFiltersBound = false;

function renderMarketplaceItems(items) {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    if (!Array.isArray(items) || items.length === 0) {
        container.innerHTML = '<p>No items match your filters.</p>';
        return;
    }

    container.innerHTML = items.map((item) => {
                const imagePath = item.filePath;
                const encodedItemId = JSON.stringify(item.id);
                const isSold = String(item.itemstatus || '').toUpperCase() === 'ELADVA';
                const priceDisplay = isSold ? 'SOLD' : `${escapeHtml(item.price)} Ft`;

                return `
            <div class="uploaded-item">
                ${imagePath ? `<div class="imageBox"><img src="${imagePath}" alt="${escapeHtml(item.name)}"></div>` : ''}
                <h3>${escapeHtml(item.name)}</h3>
                <cite>${escapeHtml(item.description || '')}</cite>
                <p><strong>Price:</strong> ${priceDisplay}</p>
                <p><strong>Type:</strong> ${escapeHtml(item.itemType)}</p>
                <p><strong>Status:</strong> ${escapeHtml(item.itemstatus)}</p>
                <button onclick='add_to_cart(${encodedItemId})'>Add</button>
                <button onclick='remove_from_cart(${encodedItemId})'>Remove</button>
            </div>
        `;
    }).join('');
}

function getMarketplaceFilterState() {
    return {
        searchText: (document.getElementById('marketSearchInput')?.value || '').trim().toLowerCase(),
        category: document.getElementById('marketCategorySelect')?.value || '',
        uploadDate: document.getElementById('marketUploadDateSelect')?.value || 'any',
        dateOrder: document.getElementById('marketDateOrderSelect')?.value || 'newest',
        minPrice: document.getElementById('marketPriceMin')?.value || '',
        maxPrice: document.getElementById('marketPriceMax')?.value || '',
        includeSold: !!document.getElementById('marketIncludeSold')?.checked
    };
}

async function applyMarketplaceFilters() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    const state = getMarketplaceFilterState();
    const params = new URLSearchParams();

    if (state.searchText) params.set('search', state.searchText);
    if (state.category) params.set('itemType', state.category);
    if (state.uploadDate && state.uploadDate !== 'any') params.set('uploadDate', state.uploadDate);
    if (state.dateOrder) params.set('dateOrder', state.dateOrder);
    if (state.minPrice !== '') params.set('minPrice', state.minPrice);
    if (state.maxPrice !== '') params.set('maxPrice', state.maxPrice);
    if (state.includeSold) params.set('includeSold', 'true');

    container.innerHTML = '<p>Loading items...</p>';

    try {
        const response = await fetch(`/items?${params.toString()}`, { method: 'GET' });
        if (!response.ok) {
            throw new Error('Failed to load filtered items');
        }

        const items = await response.json();
        renderMarketplaceItems(items);
    } catch (error) {
        console.error('Failed to fetch filtered items:', error);
        container.innerHTML = '<p>Failed to load items.</p>';
    }
}

function bindMarketplaceFilters() {
    if (marketplaceFiltersBound) return;

    const controls = [
        document.getElementById('marketSearchInput'),
        document.getElementById('marketCategorySelect'),
        document.getElementById('marketUploadDateSelect'),
        document.getElementById('marketDateOrderSelect'),
        document.getElementById('marketPriceMin'),
        document.getElementById('marketPriceMax'),
        document.getElementById('marketIncludeSold')
    ].filter(Boolean);

    controls.forEach((control) => {
        const eventName = control.tagName === 'INPUT' ? 'input' : 'change';
        control.addEventListener(eventName, () => {
            applyMarketplaceFilters();
        });
    });

    marketplaceFiltersBound = true;
}

async function loadAllItems() {
    const container = document.getElementById('itemsContainer');
    if (!container) return;

    bindMarketplaceFilters();
    await applyMarketplaceFilters();
}

async function submitUpload(event) {
    event.preventDefault();
    const form = event.target;
    const btn = form.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;

    try {
        // fetch userid
        const userResp = await fetch('/auth/user', { method: 'GET', credentials: 'include' });
        if (!userResp.ok) {
            alert('Not authenticated. Please log in.');
            if (btn) btn.disabled = false;
            return;
        }
        const user = await userResp.json();
        const userid = user.id;

        if (!userid) {
            alert('Could not retrieve user ID.');
            if (btn) btn.disabled = false;
            return;
        }

        // form field userid file 
        const fd = new FormData(form);
        fd.set('userid', userid);
        fd.set('createdBy', userid);

        // ensure itemType was selected (should be guaranteed by <select required>)
        if (!fd.get('itemType')) {
            alert('Please select a type for the item.');
            if (btn) btn.disabled = false;
            return;
        }

        // post to /items/upload
        const resp = await fetch('/items/upload', {
            method: 'POST',
            body: fd,
            credentials: 'include'
        });

        if (!resp.ok) {
            let msg = 'Upload failed';
            try { const d = await resp.json(); if (d && d.error) msg = d.error; } catch(e){}
            alert(msg);
            if (btn) btn.disabled = false;
            return;
        }

        alert('Item uploaded successfully!');
        form.reset();
        await loadAllItems();
        showsection('products');
    } catch (err) {
        console.error('Upload error:', err);
        alert('Upload failed: ' + err.message);
    } finally {
        if (btn) btn.disabled = false;
    }
}

//Logout button, then go to login page
function userLogout() {
    fetch('/auth/logout', {
        method: 'POST'
    }).then(() => {
        // Clear cookies and redirect
        document.cookie = "userName=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        document.cookie = "jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        window.location.href = '/login.html';
    }).catch(err => console.error('Logout failed:', err));
}

async function loadUserData() {
    try {
        const response = await fetch('/auth/user', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error("Not authenticated");
        }

        const user = await response.json();

        document.querySelectorAll('.nameText')
            .forEach(el => el.textContent = user.fullname);

        document.querySelectorAll('.usernameText')
            .forEach(el => el.textContent = user.username);

        document.querySelectorAll('.emailText')
            .forEach(el => el.textContent = user.email);

        document.querySelectorAll('.genderText')
            .forEach(el => el.textContent = user.gender);

        document.querySelectorAll('.phoneText')
            .forEach(el => el.textContent = user.phone);

        document.querySelectorAll('.createdAtText')
            .forEach(el => el.textContent = new Date(user.createdAt).toLocaleString());
        }catch (error) {
        console.error("Failed to load user data:", error);
    }
}

function userDelete(){
    const confirmed = confirm("Are you sure you want to permanently delete your account?");

    if (!confirmed) return;

    // remove hover overlay if active
    try { shadeOverlayRemove(); } catch (e) {}

    (async () => {
        try {
            const resp = await fetch('/auth/delete', {
                method: 'POST',
                credentials: 'include'
            });

            if (!resp.ok) {
                let errMsg = 'Failed to delete account';
                try { const data = await resp.json(); if (data && data.error) errMsg = data.error; } catch(e){}
                alert(errMsg);
                return;
            }

            // clear client-side cookies and redirect to homepage
            document.cookie = "userName=; max-age=0; path=/";
            document.cookie = "jwt=; max-age=0; path=/";

            alert('Your account has been deleted.');
            window.location.href = '/website0.html';
        } catch (err) {
            console.error('Account deletion failed:', err);
            alert('Account deletion failed. Please try again.');
        }
    })();
}


//This actives and removes the shading effect when hovering "Delete Account" button in account section
const overlay = document.querySelector('.pageOverlay');
function shadeOverlayShow() {
    overlay.classList.add('active');
}
function shadeOverlayRemove() {
    overlay.classList.remove('active');
}

// Call displayUsername when the page loads as well as user data
document.addEventListener('DOMContentLoaded', displayUsername);
document.addEventListener("DOMContentLoaded", loadUserData);
document.addEventListener('DOMContentLoaded', loadAllItems);
document.addEventListener('DOMContentLoaded', syncCartCountFromServer);
document.addEventListener('DOMContentLoaded', loadCartItemsView);
document.addEventListener('DOMContentLoaded', attachContactHandler);

let cartcount = 0;

function ensureCartListContainer() {
    const cartSection = document.getElementById('cart');
    if (!cartSection) return null;

    let container = document.getElementById('cartItemsList');
    if (container) return container;

    container = document.createElement('div');
    container.id = 'cartItemsList';
    cartSection.appendChild(container);
    return container;
}

async function loadCartItemsView() {
    const container = ensureCartListContainer();
    if (!container) return;

    container.innerHTML = '<p>Loading cart...</p>';

    try {
        const cartResp = await fetch('/items/cart', {
            method: 'GET',
            credentials: 'include'
        });

        if (!cartResp.ok) {
            container.innerHTML = '<p>Could not load cart.</p>';
            return;
        }

        const cartData = await cartResp.json();
        const cartItems = Array.isArray(cartData.cartItems) ? cartData.cartItems : [];

        if (cartItems.length === 0) {
            container.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }

        const itemsResp = await fetch('/items?includeSold=true', { method: 'GET' });
        if (!itemsResp.ok) {
            container.innerHTML = '<p>Could not load item details.</p>';
            return;
        }

        const allItems = await itemsResp.json();
        const itemsById = new Map(allItems.map((item) => [String(item.id), item]));

        const quantityById = {};
        for (const id of cartItems) {
            const key = String(id);
            quantityById[key] = (quantityById[key] || 0) + 1;
        }

        const lines = Object.entries(quantityById);
        let totalPrice = 0;

        const rowsHtml = lines.map(([id, qty]) => {
            const item = itemsById.get(id);
            if (!item) {
                return `<div class="cart-item-row"><p>Unknown item (${escapeHtml(id)}) x ${qty}</p></div>`;
            }

            const isSold = String(item.itemstatus || '').toUpperCase() === 'ELADVA';
            const unitPrice = Number(item.price) || 0;
            const lineTotal = unitPrice * qty;
            if (!isSold) {
                totalPrice += lineTotal;
            }

            const priceLine = isSold ? 'SOLD' : `${escapeHtml(unitPrice)} Ft / db`;
            const subtotalLine = isSold ? 'SOLD' : `${escapeHtml(lineTotal)} Ft`;

            return `
                <div class="cart-item-row">
                    <p><strong>${escapeHtml(item.name)}</strong> x ${qty}</p>
                    <p>${priceLine}</p>
                    <p><strong>Subtotal:</strong> ${subtotalLine}</p>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="cart-items-list">
                ${rowsHtml}
                <hr>
                <p><strong>Total:</strong> ${escapeHtml(totalPrice)} Ft</p>
            </div>
        `;
    } catch (error) {
        console.error('Could not render cart:', error);
        container.innerHTML = '<p>Could not load cart.</p>';
    }
}

function updatecartbadge(){
    const badge = document.getElementById("cartbadge");

    if (cartcount <= 0) 
    {
        badge.style.display = "none";
    } 
    else 
    {
        badge.style.display = "block";

        if (cartcount > 9) 
        {
            badge.textContent = "9+";
        } 
        
        else 
        {
            badge.textContent = cartcount;
        }
    }
}

async function syncCartCountFromServer() {
    try {
        const resp = await fetch('/items/cart', {
            method: 'GET',
            credentials: 'include'
        });

        if (!resp.ok) return;

        const data = await resp.json();
        cartcount = Number.isInteger(data.count) ? data.count : 0;
        updatecartbadge();
    } catch (error) {
        console.error('Could not sync cart count:', error);
    }
}

async function add_to_cart(itemId){
    try {
        const resp = await fetch('/items/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ itemId })
        });

        if (!resp.ok) return;

        const data = await resp.json();

        if (data.alreadyInCart) {
            alert('This item is already in your cart.');
            return;
        }

        cartcount = Number.isInteger(data.count) ? data.count : cartcount + 1;
        updatecartbadge();
        await loadCartItemsView();
        showCartPopup();
    } catch (error) {
        console.error('Could not add item to cart:', error);
    }
}

async function remove_from_cart(itemId){
    try {
        const resp = await fetch('/items/cart/remove', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ itemId })
        });

        if (!resp.ok) return;

        const data = await resp.json();
        cartcount = Number.isInteger(data.count) ? data.count : Math.max(0, cartcount - 1);
        updatecartbadge();
        await loadCartItemsView();

        const popup = document.getElementById('cart-popup');
        if (popup && popup.classList.contains('show')) {
            await renderCartPopupItems();
        }
    } catch (error) {
        console.error('Could not remove item from cart:', error);
    }
}

function goToCheckout() {
    window.location.href = "cart0.html";
}

async function fetchCartDisplayModel() {
    const cartResp = await fetch('/items/cart', {
        method: 'GET',
        credentials: 'include'
    });

    if (!cartResp.ok) {
        throw new Error('Could not load cart');
    }

    const cartData = await cartResp.json();
    const cartItems = Array.isArray(cartData.cartItems) ? cartData.cartItems : [];

    if (cartItems.length === 0) {
        return {
            rowsHtml: '<p>Your cart is empty.</p>',
            totalPrice: 0,
            hasItems: false
        };
    }

    const itemsResp = await fetch('/items?includeSold=true', { method: 'GET' });
    if (!itemsResp.ok) {
        throw new Error('Could not load item details');
    }

    const allItems = await itemsResp.json();
    const itemsById = new Map(allItems.map((item) => [String(item.id), item]));

    const quantityById = {};
    for (const id of cartItems) {
        const key = String(id);
        quantityById[key] = (quantityById[key] || 0) + 1;
    }

    const lines = Object.entries(quantityById);
    let totalPrice = 0;

    const rowsHtml = lines.map(([id, qty]) => {
        const item = itemsById.get(id);
        if (!item) {
            return `
                <div class="cart-popup-item">
                    <p>Unknown item (${escapeHtml(id)}) x ${qty}</p>
                    <button class="popup-remove-btn" onclick='remove_from_cart(${JSON.stringify(id)})'>Remove</button>
                </div>
            `;
        }

        const isSold = String(item.itemstatus || '').toUpperCase() === 'ELADVA';
        const unitPrice = Number(item.price) || 0;
        const lineTotal = unitPrice * qty;
        if (!isSold) {
            totalPrice += lineTotal;
        }

        const priceLine = isSold ? 'SOLD' : `${escapeHtml(unitPrice)} Ft / db`;
        const subtotalLine = isSold ? 'SOLD' : `${escapeHtml(lineTotal)} Ft`;

        return `
            <div class="cart-popup-item">
                <p><strong>${escapeHtml(item.name)}</strong> x ${qty}</p>
                <p>${priceLine}</p>
                <p><strong>Subtotal:</strong> ${subtotalLine}</p>
                <button class="popup-remove-btn" onclick='remove_from_cart(${JSON.stringify(item.id)})'>Remove</button>
            </div>
        `;
    }).join('');

    return {
        rowsHtml,
        totalPrice,
        hasItems: true
    };
}

function setCartPopupMode(mode) {
    const title = document.getElementById('cartPopupTitle');
    const viewCartBtn = document.getElementById('popupViewCartBtn');
    const continueLink = document.querySelector('.continue-shopping');

    if (!title || !continueLink) return;

    if (mode === 'cart') {
        title.innerHTML = '<strong>Your cart</strong>';
        if (viewCartBtn) viewCartBtn.classList.remove('hidden');
        continueLink.classList.add('hidden');
        return;
    }

    title.innerHTML = '<strong>Item added to your cart</strong>';
    if (viewCartBtn) viewCartBtn.classList.remove('hidden');
    continueLink.classList.remove('hidden');
}

async function renderCartPopupItems() {
    const itemsEl = document.getElementById('cartPopupItems');
    const totalEl = document.getElementById('cartPopupTotal');
    if (!itemsEl || !totalEl) return;

    itemsEl.innerHTML = '<p>Loading cart...</p>';
    totalEl.innerHTML = '';

    try {
        const model = await fetchCartDisplayModel();
        itemsEl.innerHTML = model.rowsHtml;
        totalEl.innerHTML = model.hasItems
            ? `<strong>Total:</strong> ${escapeHtml(model.totalPrice)} Ft`
            : '';
    } catch (error) {
        console.error('Could not render popup cart:', error);
        itemsEl.innerHTML = '<p>Could not load cart.</p>';
        totalEl.innerHTML = '';
    }
}

function showCartPopup() {
    setCartPopupMode('added');
    const popup = document.getElementById("cart-popup");
    popup.classList.add("show");
    renderCartPopupItems();
}

function hideCartPopup() {
    const popup = document.getElementById("cart-popup");
    popup.classList.remove("show");
}

document.addEventListener("click", (e) => {
    const popup = document.getElementById("cart-popup");

    if (!popup.classList.contains("show")) return;

    const clickedInsidePopup = popup.contains(e.target);
    const clickedAddButton = e.target.closest(".product button");
    const clickedCartIcon = e.target.closest('.cartdetails');

    if (!clickedInsidePopup && !clickedAddButton && !clickedCartIcon) {
        hideCartPopup();
    }
});

document.querySelector(".close-popup").addEventListener("click", () => 
{
    const popup = document.getElementById("cart-popup");
    popup.classList.remove("show");
});

document.querySelector(".continue-shopping").addEventListener("click", () => 
{
    const popup = document.getElementById("cart-popup");
    popup.classList.remove("show");
});

function openCartFromPopup() {
    hideCartPopup();
    showsection('cart');
}

function openCartPopup() {
    const popup = document.getElementById("cart-popup");
    setCartPopupMode('cart');
    popup.classList.add("show");
    renderCartPopupItems();
}

//A Pénztárban a CheckoutReturn gomb használatával a felhasználó visszatér a #products oldalra, és megjelenek a termékek.
window.onload = function() {
    if (window.location.hash === "#products") {
        showsection("products");

        //Eltávolítja a #products hash-t, így az oldal újratöltésekor a felhasználó visszatér a products oldalra.
        history.replaceState(null, null, window.location.pathname);
    }
};