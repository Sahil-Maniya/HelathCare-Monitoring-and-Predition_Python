document.addEventListener("DOMContentLoaded", function () {
    document
      .getElementById("registerForm")
      .addEventListener("submit", function (e) {
        let isValid = true;
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmPassword = document.getElementById("confirm").value;
        const captcha = document.getElementById("captcha").value.trim();
        const nameRegex = /^[A-Za-z\s]{3,}$/;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        // Name Validation
        if (!nameRegex.test(name)) {
          alert(
            "Name must be at least 3 characters and contain only letters."
          );
          isValid = false;
        }

        // Email Validation
        if (!emailRegex.test(email)) {
          alert("Please enter a valid email address.");
          isValid = false;
        }

        // Password Validation
        if (!passwordRegex.test(password)) {
          alert(
            "Password must be at least 8 characters, include an uppercase letter, a lowercase letter, a number, and a special character."
          );
          isValid = false;
        }

        // Confirm Password Validation
        if (password !== confirmPassword) {
          alert("Passwords do not match.");
          isValid = false;
        }

        // CAPTCHA Validation
        if (captcha === "") {
          alert("Please enter the CAPTCHA code.");
          isValid = false;
        }

        // Prevent form submission if validation fails
        if (!isValid) {
          e.preventDefault();
        }
      });
  });

  // Display Flask flash messages as alerts
  document.addEventListener("DOMContentLoaded", () => {
    const flashMessages = document.querySelectorAll(".flash-message");
    flashMessages.forEach((message) => {
      alert(message.textContent); // Show each message as a JavaScript alert
    });
  });
  
  // Automatically close flash messages after 2 seconds
  setTimeout(function () {
    let flashMessages = document.getElementById("flash-messages");
    if (flashMessages) {
      flashMessages.style.transition = "opacity 0.5s";
      flashMessages.style.opacity = "0";
      setTimeout(() => flashMessages.remove(), 500);
    }
  }, 2000);