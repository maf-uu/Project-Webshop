let eyeicon = document.getElementById("logineyeicon");

eyeicon.onclick = function(){
    if(password.type == "password"){
        password.type = "text";
        logineyeicon.src = "eye-open.png"
    }else{
        password.type = "password";
        logineyeicon.src = "eye-close.png"
    }
}

window.addEventListener("load", () => {
    const logForm = document.querySelector(".login-form");
    const formLinks = document.querySelector(".form-links");
    if (logForm) {
        logForm.style.opacity = "1";
        logForm.style.transform = "translateY(0)";
    }

    if (formLinks) {
        formLinks.style.opacity = "1";
        formLinks.style.transform = "translateY(0)";
    }
});

async function submitLogin(event) {
    event.preventDefault();

    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
        const email = (document.getElementById('email')?.value || '').trim();
        const passwordValue = document.getElementById('password')?.value || '';

        const response = await fetch('/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password: passwordValue }),
        });

        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            alert((data && data.error) ? data.error : 'Login failed.');
            return;
        }

        window.location.href = '/website0.html';
    } catch (error) {
        console.error('Login failed:', error);
        alert('Login failed. Please try again.');
    } finally {
        if (submitButton) submitButton.disabled = false;
    }
}

const loginForm = document.getElementById('login');
if (loginForm) {
    loginForm.addEventListener('submit', submitLogin);
}
