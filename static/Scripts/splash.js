function redirectToLoginPage() {
    document.body.classList.add("fade-out"); // Apply fade-out effect
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000); // Redirect after 1s
  }

  // Redirect after 3 seconds
  setTimeout(redirectToLoginPage, 3000);