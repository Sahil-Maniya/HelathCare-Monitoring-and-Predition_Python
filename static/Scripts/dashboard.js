const userId = 1;
function updateHealthData() {
  const weight = parseInt(document.getElementById("weight").value) || 0;
  const steps = parseInt(document.getElementById("steps").value) || 0;
  const heartRate =
    parseInt(document.getElementById("heart_rate").value) || 0;
  const systolic =
    parseInt(document.getElementById("systolic").value) || 0;
  const diastolic =
    parseInt(document.getElementById("diastolic").value) || 0;
  const sleep = parseFloat(document.getElementById("sleep").value) || 0;
  const calories =
    parseInt(document.getElementById("calories").value) || 0;

  // Validate fields
  const errors = [];

  if (weight <= 0) errors.push("❌ Weight must be greater than 0.");
  if (steps < 0) errors.push("❌ Steps cannot be negative.");
  if (heartRate <= 60 || heartRate > 200)
    errors.push("❌ Heart Rate must be between 60 and 100 bpm.");
  if (systolic <= 0 || systolic > 200)
    errors.push("❌ Systolic pressure must be between 1 and 200.");
  if (diastolic <= 0 || diastolic > 150)
    errors.push("❌ Diastolic pressure must be between 1 and 150.");
  if (sleep <= 0 || sleep > 24)
    errors.push("❌ Sleep hours must be between 1 and 24.");
  if (calories < 0 || calories > 10000)
    errors.push("❌ Calories burned must be between 0 and 10,000.");

  if (errors.length > 0) {
    // Show errors as alert or on page
    alert(errors.join("\n"));
    return; // Stop further processing
  }

  const healthData = {
    user_id: userId,
    metrics: {
      "Weight (kg)": weight,
      "Steps Walked": steps,
      "Heart Rate (bpm)": heartRate,
      "Blood Pressure (Systolic)": systolic,
      "Blood Pressure (Diastolic)": diastolic,
      "Sleep Hours": sleep,
      "Calories Burned": calories,
    },
  };

  // Optional loading message
  document.getElementById("health-suggestions").innerHTML =
    "<p>Updating health data...</p>";

  fetch("/update_health", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(healthData),
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data.message);
      setTimeout(fetchHealthData, 1000);
    })
    .catch((error) => console.error("Error:", error));
}

// Fetch health data for the chart
function fetchHealthData() {
  fetch(`/get_health_data/${userId}`)
    .then((response) => response.json())
    .then((data) => {
      let labels = [];
      let values = [];
      let backgroundColors = [];
      let suggestions = [];

      let thresholds = {
        "Weight (kg)": { min: 50, max: 100, axis: "left" },
        "Steps Walked": { min: 3000, max: 15000, axis: "right" }, // Large range, assign to right axis
        "Heart Rate (bpm)": { min: 60, max: 100, axis: "left" },
        "Blood Pressure (Systolic)": { min: 90, max: 130, axis: "left" },
        "Blood Pressure (Diastolic)": { min: 60, max: 80, axis: "left" },
        "Sleep Hours": { min: 6, max: 8, axis: "left" }, // Low range, assign to left axis
        "Calories Burned": { min: 1800, max: 2500, axis: "right" }, // Large range, assign to right axis
      };

      let allDataEmpty = true;

      let leftAxisData = [];
      let rightAxisData = [];

      for (let [key, value] of Object.entries(data)) {
        if (value !== null && value !== undefined && value !== 0) {
          allDataEmpty = false;
        }

        labels.push(key);
        let min = thresholds[key]?.min || 0;
        let max = thresholds[key]?.max || Infinity;

        // Assign values to correct axis
        if (thresholds[key]?.axis === "right") {
          rightAxisData.push(value || 0);
          leftAxisData.push(null); // Keep left-axis data empty for this value
        } else {
          leftAxisData.push(value || 0);
          rightAxisData.push(null); // Keep right-axis data empty for this value
        }

        // Assign color coding based on threshold
        if (value > max) {
          suggestions.push(
            `⚠️ ${key} is too high. Consider lifestyle changes.`
          );
          backgroundColors.push("rgba(255, 99, 132, 0.8)"); // Red
        } else if (value < min && value !== 0) {
          suggestions.push(`⚠️ ${key} is too low. Focus on improvement.`);
          backgroundColors.push("rgba(255, 206, 86, 0.8)"); // Yellow
        } else {
          backgroundColors.push("rgba(75, 192, 192, 0.6)"); // Green
        }
      }

      // If all data is empty, show a message in the suggestion box
      if (allDataEmpty) {
        suggestions = [
          "🚫 Your data is empty. Please update your health metrics.",
        ];
        labels = ["No Data"];
        leftAxisData = [0];
        rightAxisData = [0];
        backgroundColors = ["rgba(200, 200, 200, 0.6)"]; // Grey
      }

      document.getElementById(
        "health-suggestions"
      ).innerHTML = `<ul>${suggestions
        .map((s) => `<li>${s}</li>`)
        .join("")}</ul>`;

      // Update chart data
      healthChart.data.labels = labels;
      healthChart.data.datasets[0].data = leftAxisData;
      healthChart.data.datasets[1].data = rightAxisData;

      // Assign dynamic background colors based on thresholds
      healthChart.data.datasets[0].backgroundColor = labels.map(
        (key, i) => backgroundColors[i]
      );
      healthChart.data.datasets[1].backgroundColor = labels.map(
        (key, i) => backgroundColors[i]
      );

      healthChart.update();
    })
    .catch((error) => {
      console.error("Error fetching health data:", error);
      document.getElementById("health-suggestions").innerHTML =
        "<p>⚠️ Failed to fetch health data.</p>";
    });
}

// Chart.js configuration with dual Y-axes
var ctx = document.getElementById("healthChart").getContext("2d");
var healthChart = new Chart(ctx, {
  type: "bar",
  data: {
    labels: [],
    datasets: [
      {
        label: "Health Metrics (Small Range)",
        data: [], // Left axis metrics (Weight, Sleep Hours, Heart Rate, etc.)
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        yAxisID: "yLeft",
      },
      {
        label: "Health Metrics (Large Range)",
        data: [], // Right axis metrics (Steps Walked, Calories Burned)
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
        yAxisID: "yRight",
      },
    ],
  },
  options: {
    responsive: true,
    scales: {
      yLeft: {
        beginAtZero: true,
        position: "left",
        title: { display: true, text: "Weight, Sleep, Heart Rate, BP" },
      },
      yRight: {
        beginAtZero: true,
        position: "right",
        title: { display: true, text: "Steps Walked, Calories Burned" },
        grid: { drawOnChartArea: false }, // Prevents grid overlap
      },
    },
  },
});
// Load chart when page loads
window.onload = fetchHealthData;

// Automatically close flash messages after 2 seconds
setTimeout(function () {
  let flashMessages = document.getElementById("flash-messages");
  if (flashMessages) {
    flashMessages.style.transition = "opacity 0.5s";
    flashMessages.style.opacity = "0";
    setTimeout(() => flashMessages.remove(), 500);
  }
}, 2000);