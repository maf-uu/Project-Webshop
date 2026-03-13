window.addEventListener("load", () => {
    const checkoutLayout = document.querySelector(".checkoutLayout");
    if (checkoutLayout) {
        checkoutLayout.style.opacity = "1";
        checkoutLayout.style.transform = "translateY(0)";
    }
});

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

        document.querySelectorAll('.emailText')
            .forEach(el => el.textContent = user.email);

        document.querySelectorAll('.phoneText')
            .forEach(el => el.textContent = user.phone);

        const nameInput = document.getElementById("name");
        if (nameInput) nameInput.value = user.fullname || "";

        const emailInput = document.getElementById("email");
        if (emailInput) emailInput.value = user.email || "";

        const phoneInput = document.getElementById("phone");
        if (phoneInput) phoneInput.value = user.phone || "";

    } catch (error) {
        console.error("Failed to load user data:", error);
    }
}

document.addEventListener("DOMContentLoaded", loadUserData);

function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

async function loadCheckoutCartItems() {
    const itemsContainer = document.getElementById('checkoutCartItems');
    const totalContainer = document.getElementById('checkoutCartTotal');

    if (!itemsContainer || !totalContainer) return;

    itemsContainer.innerHTML = '<p>Loading cart...</p>';
    totalContainer.textContent = '';

    try {
        const cartResp = await fetch('/items/cart', {
            method: 'GET',
            credentials: 'include'
        });

        if (!cartResp.ok) {
            itemsContainer.innerHTML = '<p>Could not load cart.</p>';
            return;
        }

        const cartData = await cartResp.json();
        const cartItems = Array.isArray(cartData.cartItems) ? cartData.cartItems : [];

        if (cartItems.length === 0) {
            itemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            return;
        }

        const itemsResp = await fetch('/items', { method: 'GET' });
        if (!itemsResp.ok) {
            itemsContainer.innerHTML = '<p>Could not load item details.</p>';
            return;
        }

        const allItems = await itemsResp.json();
        const itemsById = new Map(allItems.map((item) => [String(item.id), item]));

        const quantityById = {};
        for (const id of cartItems) {
            const key = String(id);
            quantityById[key] = (quantityById[key] || 0) + 1;
        }

        let totalPrice = 0;
        const rowsHtml = Object.entries(quantityById).map(([id, qty]) => {
            const item = itemsById.get(id);
            if (!item) {
                return `<div class="checkoutCartItem"><p>Unknown item (${escapeHtml(id)}) x ${qty}</p></div>`;
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
                <div class="checkoutCartItem">
                    <p><strong>${escapeHtml(item.name)}</strong> x ${qty}</p>
                    <p>${priceLine}</p>
                    <p><strong>Subtotal:</strong> ${subtotalLine}</p>
                </div>
            `;
        }).join('');

        itemsContainer.innerHTML = rowsHtml;
        totalContainer.innerHTML = `<strong>Total:</strong> ${escapeHtml(totalPrice)} Ft`;
    } catch (error) {
        console.error('Failed to render checkout cart:', error);
        itemsContainer.innerHTML = '<p>Could not load cart.</p>';
        totalContainer.textContent = '';
    }
}

document.addEventListener('DOMContentLoaded', loadCheckoutCartItems);

async function completeCheckout(event) {
    event.preventDefault();

    const form = event.target;
    const payButton = form.querySelector('.payNowButton');

    if (payButton) {
        payButton.disabled = true;
    }

    try {
        const response = await fetch('/items/cart/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include'
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const errorMessage = data && data.error ? data.error : 'Checkout failed.';
            alert(errorMessage);
            return;
        }

        const deletedCount = Number.isInteger(data.deletedCount) ? data.deletedCount : 0;
        alert(`Checkout complete.`);

        await loadCheckoutCartItems();
        window.location.href = '/website0.html#cart';
    } catch (error) {
        console.error('Checkout request failed:', error);
        alert('Checkout failed. Please try again.');
    } finally {
        if (payButton) {
            payButton.disabled = false;
        }
    }
}

function bindCheckoutForm() {
    const purchaseForm = document.getElementById('purchase');
    if (!purchaseForm) return;

    purchaseForm.addEventListener('submit', completeCheckout);
}

document.addEventListener('DOMContentLoaded', bindCheckoutForm);

//A Pénztárban a CheckoutReturn gomb használatával a felhasználó visszatér a #products oldalra, és megjelenek a termékek.
function CheckoutReturn() {
    window.location.href = "/#products";
}

//Mobilon elég görgetés után elhalványítja a visszatérés gombot, és letiltja a kattintást
const logo = document.querySelector(".checkoutreturnpng");

window.addEventListener("scroll", () => {
    if (!logo || window.innerWidth > 690) return;

    const scrollY = window.scrollY;
    const fadeEnd = 55;

    const opacity = Math.max(0, 1 - scrollY / fadeEnd);
    logo.style.opacity = opacity;

    if (opacity <= 0.001) {
        logo.style.pointerEvents = "none";
        logo.style.visibility = "hidden";
        logo.classList.add("fade-out");
    } else {
        logo.style.pointerEvents = "auto";
        logo.style.visibility = "visible";
        logo.classList.remove("fade-out");
    }
});