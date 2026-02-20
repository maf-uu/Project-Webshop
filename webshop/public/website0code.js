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

function handleUploadClick(){
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
            .forEach(el => el.textContent = user.name);

        document.querySelectorAll('.emailText')
            .forEach(el => el.textContent = user.email);

        document.querySelectorAll('.genderText')
            .forEach(el => el.textContent = user.gender);

        document.querySelectorAll('.phoneText')
            .forEach(el => el.textContent = user.phone);

        document.querySelectorAll('.createdAtText')
            .forEach(el => el.textContent =
                new Date(user.createdAt).toLocaleString());

    } catch (error) {
        console.error("Failed to load user data:", error);
    }
}

function userDelete(){
    const confirmed = confirm("Are you sure you want to permanently delete your account?");

    if (confirmed) {
        //user confirmed their deletion
    } else {
        //user cancelled their deletion
    }
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
