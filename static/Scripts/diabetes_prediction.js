// Basic client-side validation
function validateForm() {
    var formValid = true;
    var errorMessages = "";


    // Get all the input fields
    var pregnancies = document.forms["diabetesForm"]["Pregnancies"].value;
    var glucose = document.forms["diabetesForm"]["Glucose"].value;
    var bloodPressure = document.forms["diabetesForm"]["BloodPressure"].value;
    var skinThickness = document.forms["diabetesForm"]["SkinThickness"].value;
    var insulin = document.forms["diabetesForm"]["Insulin"].value;
    var bmi = document.forms["diabetesForm"]["BMI"].value;
    var diabetesPedigreeFunction = document.forms["diabetesForm"]["DiabetesPedigreeFunction"].value;
    var age = document.forms["diabetesForm"]["Age"].value;


    // Check for valid numeric input and prevent negative values
    if (isNaN(pregnancies) || pregnancies < 0) {
      formValid = false;
      errorMessages += "⚠️ Invalid number for Pregnancies. Please enter a valid non-negative number.\n";
    }
    if (isNaN(glucose) || glucose < 0) {
      formValid = false;
      errorMessages += "⚠️ Invalid glucose level. Please enter a valid number.\n";
    }
    if (isNaN(bloodPressure) || bloodPressure < 0) {
      formValid = false;
      errorMessages += "⚠️ Invalid blood pressure. Please enter a valid number.\n";
    }
    if (isNaN(skinThickness) || skinThickness < 0) {
      formValid = false;
      errorMessages += "⚠️ Invalid skin thickness. Please enter a valid number.\n";
    }
    if (isNaN(insulin) || insulin < 0) {
      formValid = false;
      errorMessages += "⚠️ Invalid insulin level. Please enter a valid number.\n";
    }
    if (isNaN(bmi) || bmi < 0) {
      formValid = false;
      errorMessages += "⚠️ Invalid BMI or body weight level. Please enter a valid number.\n";
    }
    if (isNaN(diabetesPedigreeFunction) || diabetesPedigreeFunction < 0 || diabetesPedigreeFunction > 1) {
      formValid = false;
      errorMessages += "⚠️ Invalid family history ratio. Please enter a number between 0 and 1.\n";
    }
    if (isNaN(age) || age < 0) {
      formValid = false;
      errorMessages += "⚠️ Invalid age. Please enter a valid number.\n";
    }


    // Glucose level validation
    if (glucose < 40) {
      formValid = false;
      errorMessages += "⚠️ The minimum required glucose level is 40.\n";
    } else if (glucose < 70) {
      formValid = false;
      errorMessages += "⚠️ The glucose level is below the recommended value of 70.\n";
    } else if (glucose > 180) {
      formValid = false;
      errorMessages += "⚠️ The glucose level is too high. Maximum limit is 180.\n";
    }


    // Blood Pressure validation
    if (bloodPressure < 50) {
      formValid = false;
      errorMessages += "⚠️ The minimum required blood pressure is 50.\n";
    } else if (bloodPressure > 170) {
      formValid = false;
      errorMessages += "⚠️ The maximum allowed blood pressure is 170.\n";
    }


    // Skin Thickness validation (Body Fat)
    if (skinThickness < 20) {
      formValid = false;
      errorMessages += "⚠️ The minimum required skin thickness is 20 mm.\n";
    } else if (skinThickness > 45) {
      formValid = false;
      errorMessages += "⚠️ The maximum allowed skin thickness is 45 mm.\n";
    }


    // Insulin validation
    if (insulin < 20) {
      formValid = false;
      errorMessages += "⚠️ The minimum required insulin level is 20.\n";
    } else if (insulin > 1000) {
      formValid = false;
      errorMessages += "⚠️ The maximum allowed insulin level is 1000.\n";
    }


    // BMI validation (Body Mass Index / Weight Level)
    if (bmi < 18.5) {
      formValid = false;
      errorMessages += "⚠️ The minimum required BMI or body weight level is 18.5.\n";
    } else if (bmi > 45.5) {
      formValid = false;
      errorMessages += "⚠️ The maximum allowed BMI or body weight level is 45.5.\n";
    }


    // If validation fails, show all error messages at once
    if (!formValid) {
      alert(errorMessages);  // Show the alert pop-up with all error messages
      return false;  // Prevent form submission
    }
    return true;  // Allow form submission
  }