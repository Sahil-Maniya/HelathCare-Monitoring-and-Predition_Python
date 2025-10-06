   // Check if passwords match from database before submitting the form
   document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
        let flashMessages = document.querySelectorAll(".flash-messages");

        flashMessages.forEach(function (message) {
            message.style.transition = "opacity 0.5s ease-out";
            message.style.opacity = "0";

            // Remove the message after fade-out
            setTimeout(() => {
                if (message.parentNode) {
                    message.parentNode.removeChild(message);
                }
            }, 500);
        });

        // Remove flash messages container if empty
        setTimeout(() => {
            let flashContainer = document.getElementById("flash-messages");
            if (flashContainer && flashContainer.childElementCount === 0) {
                flashContainer.remove();
            }
        }, 2500);
    }, 2000);
});