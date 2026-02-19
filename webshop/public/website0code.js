function showsection(name)
{
    const sections = document.querySelectorAll('.section');

    sections.forEach(sec => {
        sec.classList.add("hidden");
    });

    const active = document.getElementById(name);
    active.classList.remove("hidden");
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

function userDelete(){

}

//This actives and removes the shading effect when hovering "Delete Account" button in account section
const overlay = document.querySelector('.pageOverlay');
function shadeOverlayShow() {
    overlay.classList.add('active');
}
function shadeOverlayRemove() {
    overlay.classList.remove('active');
}

// Call displayUsername when the page loads
document.addEventListener('DOMContentLoaded', displayUsername);

let cartcount = 0;

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

function add_to_cart(){
    cartcount++;
    updatecartbadge();
    showCartPopup();
}

function remove_from_cart(){
    if (cartcount > 0) 
    {
        cartcount--;
        updatecartbadge();
    }
}

function goToCheckout() {
    window.location.href = "cart0.html";
}

function showCartPopup() {
    const popup = document.getElementById("cart-popup");
    popup.classList.add("show");
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

    if (!clickedInsidePopup && !clickedAddButton) {
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
    const popup = document.getElementById("cart-popup");
    popup.classList.remove("show");
    showsection('cart');
}
