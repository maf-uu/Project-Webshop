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
        attachUploadHandler();
    } else {
        // User is not logged in, go to register page
        window.location.href = '/register.html';
    }
}

let _uploadHandlerAttached = false;
function attachUploadHandler() {
    if (_uploadHandlerAttached) return;
    const form = document.getElementById('uploaditem');
    if (!form) return;
    form.addEventListener('submit', submitUpload);
    _uploadHandlerAttached = true;
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

//Using the CheckoutReturn button in Checkout brings user back to website0.html and shows the cart section
window.onload = function() {
    if (window.location.hash === "#cart") {
        showsection("cart");

        //Removes #cart hash so upon reload of page, it ends user back to regular frontpage state
        history.replaceState(null, null, window.location.pathname);
    }
};

