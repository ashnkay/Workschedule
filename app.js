const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
const topToggle = document.getElementById("top-toggle");
const shiftInputs = document.getElementById("shift-inputs");

// Load or initialize schedule
let scheduleData = JSON.parse(localStorage.getItem("scheduleData")) || {};
daysOfWeek.forEach(day => {
  if (!scheduleData[day]) {
    scheduleData[day] = { work: false, shift: "09:00", reminder: 60 };
  }
});

// Top horizontal toggles
daysOfWeek.forEach(day => {
  const div = document.createElement("div");
  div.classList.add("day-box");
  div.textContent = day;
  if(scheduleData[day].work) div.classList.add("work");
  div.onclick = () => {
    scheduleData[day].work = !scheduleData[day].work;
    div.classList.toggle("work");
    localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
  };
  topToggle.appendChild(div);
});

// Vertical shift inputs under the top row
daysOfWeek.forEach(day => {
  const container = document.createElement("div");
  container.classList.add("shift-input");

  const label = document.createElement("label");
  label.textContent = `${day} shift:`;
  container.appendChild(label);

  const timeInput = document.createElement("input");
  timeInput.type = "time";
  timeInput.value = scheduleData[day].shift;
  timeInput.onchange = () => {
    scheduleData[day].shift = timeInput.value;
    localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
  };
  container.appendChild(timeInput);

  const reminderLabel = document.createElement("label");
  reminderLabel.textContent = "Reminder (minutes before shift)";
  container.appendChild(reminderLabel);

  const reminderInput = document.createElement("input");
  reminderInput.type = "number";
  reminderInput.min = 0;
  reminderInput.value = scheduleData[day].reminder;
  reminderInput.onchange = () => {
    scheduleData[day].reminder = parseInt(reminderInput.value);
    localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
  };
  container.appendChild(reminderInput);

  shiftInputs.appendChild(container);
});

// Request Notification permission
if ("Notification" in window) {
  Notification.requestPermission();
}

// Send notification
function sendNotification(day) {
  if(Notification.permission === "granted") {
    new Notification(`Shift Reminder`, {
      body: `Your ${day} shift starts in ${scheduleData[day].reminder} minutes!`,
      icon: "logo.png"
    });
  }
}

// Check reminders every minute
setInterval(() => {
  const now = new Date();
  daysOfWeek.forEach(day => {
    if(scheduleData[day].work) {
      const [hour, minute] = scheduleData[day].shift.split(":").map(Number);
      const shiftTime = new Date();
      shiftTime.setHours(hour);
      shiftTime.setMinutes(minute - scheduleData[day].reminder);
      shiftTime.setSeconds(0);
      shiftTime.setMilliseconds(0);
      if(Math.abs(now - shiftTime) < 60000) {
        sendNotification(day);
      }
    }
  });
}, 60000);
