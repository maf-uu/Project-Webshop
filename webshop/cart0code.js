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

//Using the CheckoutReturn button in Checkout brings user back to website0.html and shows the cart section
function CheckoutReturn() {
    window.location.href = "/website0.html#cart";
}
