// Script.js - Placeholder for future interactivity
console.log('Thalium Bank App Loaded');

$(document).ready(function() {
    // Input Masks
    $(":input").inputmask();
    $("#cpf").inputmask("999.999.999-99");

    // Auto Logout Timer (5 minutes)
    let inactivityTime = function () {
        let time;
        window.onload = resetTimer;
        document.onmousemove = resetTimer;
        document.onkeypress = resetTimer;

        function logout() {
            window.location.href = '/logout';
        }

        function resetTimer() {
            clearTimeout(time);
            time = setTimeout(logout, 300000); // 5 minutes
        }
    };
    inactivityTime();
});

// Privacy Toggle
function toggleBalance() {
    const balances = document.querySelectorAll('.balance-value');
    const icon = document.getElementById('toggle-eye');
    let isHidden = localStorage.getItem('balanceHidden') === 'true';

    if (isHidden) {
        // Show
        balances.forEach(el => {
            el.innerText = el.getAttribute('data-value');
            el.classList.remove('blur-text');
        });
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
        localStorage.setItem('balanceHidden', 'false');
    } else {
        // Hide
        balances.forEach(el => {
            el.setAttribute('data-value', el.innerText);
            el.innerText = '••••••';
            el.classList.add('blur-text');
        });
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
        localStorage.setItem('balanceHidden', 'true');
    }
}

// Initialize state on load
document.addEventListener("DOMContentLoaded", function() {
    if (localStorage.getItem('balanceHidden') === 'true') {
        // Force hide immediately
        localStorage.setItem('balanceHidden', 'false'); // Toggle logic expects opposite
        toggleBalance();
    }
});
