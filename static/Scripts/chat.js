var currentRequest = null; // Track the current AJAX request
    
$(document).ready(function () {
  $("#messageArea").on("submit", function (event) {
    event.preventDefault();
          
    const date = new Date();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const str_time = hour + ":" + (minute < 10 ? "0" : "") + minute;

    var rawText = $("#text").val().trim();
    if (rawText === "") return;

    // Append User Message
    var userHtml = `
      <div class="d-flex justify-content-end mb-4">
        <div class="msg_cotainer_send">${rawText}
          <span class="msg_time_send">${str_time}</span>
        </div>
        <div class="img_cont_msg">
          <img src="https://i.ibb.co/d5b84Xw/Untitled-design.png" class="rounded-circle user_img_msg">
        </div>
      </div>`;

    $("#text").val("");
    $("#messageFormeight").append(userHtml);

    // Unique ID for bot message
    const uniqueID = "bot-message-" + Date.now();
    var botHtml = `
      <div class="d-flex justify-content-start mb-4">
        <div class="img_cont_msg">
          <img src="/static/Images/doctor.png" class="rounded-circle user_img_msg">
        </div>
        <div class="msg_cotainer" id="${uniqueID}">
          <div class="typing-indicator">
            <span></span><span></span><span></span>
          </div>
          <span class="msg_time">${str_time}</span>
        </div>
      </div>`;

    $("#messageFormeight").append(botHtml);

    //  Send AJAX Request to Backend
    currentRequest = $.ajax({
      type: "POST",
      url: "/get_response",
      contentType: "application/json",
      data: JSON.stringify({ message: rawText }),
      success: function (response) {
        typeWriterEffect($("#" + uniqueID)[0], response.response, 40, function () {
        stopResponse();
        });
      },
      error: function () {
        stopResponse();
        $("#" + uniqueID).html("<small class='text-danger'>❌ Error fetching response.</small>");
      },
      complete: function () {
        currentRequest = null;
      },
    });
  });
});

// Typewriter Effect for Bot Response
function typeWriterEffect(element, text, speed = 50, callback = null) {
  let i = 0;
  element.innerHTML = "";
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(type, speed);
    } else {
      if (callback) callback(); //  Call the callback when typing is done
    }
  }
  type();
}