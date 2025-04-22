function validateForm() {
  const fileInput = document.getElementById("file1");
  const errorMessage = document.getElementById("error-message");

  if (!fileInput.files || fileInput.files.length === 0) {
      errorMessage.innerText = "🚫 Please select an image before uploading.";
      errorMessage.style.display = "block";
      return false;
  }

  const file = fileInput.files[0];

  if (!file.type.startsWith("image/")) {
      errorMessage.innerText = "🚫 The selected file is not an image.";
      errorMessage.style.display = "block";
      fileInput.value = "";
      return false;
  }

  // Check if the image is grayscale (black & white)
  const reader = new FileReader();
  reader.onload = function (e) {
      const img = new Image();
      img.onload = function () {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          let totalPixels = 0;
          let grayscalePixels = 0;

          for (let i = 0; i < data.length; i += 4) {
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];

              // Count pixel as grayscale if RGB values are very close
              if (Math.abs(r - g) < 10 && Math.abs(r - b) < 10 && Math.abs(g - b) < 10) {
                  grayscalePixels++;
              }
              totalPixels++;
          }

          const grayscalePercentage = (grayscalePixels / totalPixels) * 100;

          if (grayscalePercentage < 70) {
              alert("⚠️ Please upload a  MRI Scan image..");
              fileInput.value = "";
              return false;
          } else {
              document.querySelector("form").submit(); // All good, submit the form
          }
      };
      img.src = e.target.result;
  };
  reader.readAsDataURL(file);

  return false; // Prevent default form submit, will submit manually if valid
}
