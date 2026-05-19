document.getElementById("signup").addEventListener("submit", async function(event) {

    event.preventDefault();

    // JAVÍTVA: Az id="username" mezőt kérjük le a "name" helyett
    let username = document.getElementById("username");
    let password = document.getElementById("password");
    let confirmpassword = document.getElementById("confirmpassword");
    let email = document.getElementById("email");
    let phone = document.getElementById("phone");
    let terms = document.getElementById("terms");
    let serverErrorContainer = document.getElementById("server-error-container");

    // Minden küldés előtt elrejtjük a korábbi szerver hibát
    serverErrorContainer.style.display = "none";
    serverErrorContainer.innerText = "";

    const passwordReq = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    const phoneReq = /^\+\d{2}\/\d{2}-\d{3}-\d{4}$/;
    const emailReq = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    let errors = [];

    // username
    if (username.value.trim() === "") {
        errors.push("Username cannot be empty.");
        username.classList.add("input-error");
    } else {
        username.classList.remove("input-error");
    }

    // password
    if (!passwordReq.test(password.value)) {
        errors.push("Password does not meet requirements.");
        password.parentElement.classList.add("input-error");
    } else {
        password.parentElement.classList.remove("input-error");
    }

    // confirm password
    if (password.value !== confirmpassword.value) {
        errors.push("Passwords do not match.");
        confirmpassword.classList.add("input-error");
    } else {
        confirmpassword.classList.remove("input-error");
    }

    // email
    if (!emailReq.test(email.value.trim())) {
        errors.push("Invalid email address.");
        email.classList.add("input-error");
    } else {
        email.classList.remove("input-error");
    }

    // phone
    if (!phoneReq.test(phone.value.trim())) {
        errors.push("Phone number format is invalid.");
        phone.classList.add("input-error");
    } else {
        phone.classList.remove("input-error");
    }

    // terms
    if (!terms.checked) {
        errors.push("You must accept the terms and conditions.");
        terms.classList.add("input-error");
    } else {
        terms.classList.remove("input-error");
    }

    if (errors.length > 0) {
        alert(errors.join("\n"));
        return; // Ha van kliensoldali hiba, megállunk
    }

    // ÚJ: Háttérben történő adatküldés (Fetch API)
    try {
        const formData = new FormData(this);
        const searchParams = new URLSearchParams(formData);

        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: searchParams
        });

        const result = await response.json();

        if (response.ok && result.status === "success") {
            // Ha sikeres a regisztráció, a kliens végzi az átirányítást
            window.location.href = result.redirect;
        } else {
            // Backend hiba megjelenítése az oldalon (JSON felugrás helyett)
            serverErrorContainer.innerText = result.error || "Ismeretlen hiba történt.";
            serverErrorContainer.style.display = "block";
        }
    } catch (err) {
        serverErrorContainer.innerText = "Hálózati hiba történt. Kérjük, próbálja újra később.";
        serverErrorContainer.style.display = "block";
    }
});

let eyeicon = document.getElementById("eyeicon");

eyeicon.onclick = function() {
    if (password.type == "password") {
        password.type = "text";
        confirmpassword.type = "text";
        eyeicon.src = "eye-open.png"
    } else {
        password.type = "password";
        confirmpassword.type = "password";
        eyeicon.src = "eye-close.png"
    }
}

window.addEventListener("load", () => {
    const regForm = document.querySelector(".register-form");
    const formLinks = document.querySelector(".form-links");
    if (regForm) {
        regForm.style.opacity = "1";
        regForm.style.transform = "translateY(0)";
    }

    if (formLinks) {
        formLinks.style.opacity = "1";
        formLinks.style.transform = "translateY(0)";
    }
});

const logo = document.querySelector(".eisenshoptextpng");

window.addEventListener("scroll", () => {
    if (!logo || window.innerWidth > 690 || window.innerWidth > window.innerHeight) return;

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
