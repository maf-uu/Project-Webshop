let eyeicon = document.getElementById("logineyeicon");

eyeicon.onclick = function(){
    if(loginpassword.type == "password"){
        loginpassword.type = "text";
        logineyeicon.src = "eye-open.png"
    }else{
        loginpassword.type = "password";
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