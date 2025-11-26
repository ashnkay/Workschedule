const days = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function buildWeeklyTemplate() {
  const container = document.getElementById("weeklyTemplate");
  container.innerHTML = "";

  days.forEach(day => {
    const div = document.createElement("div");
    div.innerHTML = `
      <label>${day} Start</label>
      <input type="time" id="${day}_start">

      <label>${day} End</label>
      <input type="time" id="${day}_end">
    `;
    container.appendChild(div);
  });

  loadWeeklyTemplate();
}
buildWeeklyTemplate();

let dynamicShifts = JSON.parse(localStorage.getItem("dynamicShifts") || "[]");
let reminderMinutes = parseInt(localStorage.getItem("reminderMinutes") || "60");

function saveWeeklyTemplate() {
  const schedule = {};

  days.forEach(day => {
    schedule[day] = {
      start: document.getElementById(`${day}_start`).value,
      end: document.getElementById(`${day}_end`).value
    };
  });

  localStorage.setItem("weeklySchedule", JSON.stringify(schedule));
  alert("Weekly schedule saved!");
  scheduleNotifications();
}

function loadWeeklyTemplate() {
  const saved = JSON.parse(localStorage.getItem("weeklySchedule") || "{}");

  days.forEach(day => {
    if (saved[day]) {
      document.getElementById(`${day}_start`).value = saved[day].start || "";
      document.getElementById(`${day}_end`).value = saved[day].end || "";
    }
  });
}

function addDynamicShift() {
  const date = document.getElementById("dynDate").value;
  const start = document.getElementById("dynStart").value;
  const end = document.getElementById("dynEnd").value;

  if (!date || !start || !end) return alert("Fill all fields.");

  dynamicShifts.push({ date, start, end });
  localStorage.setItem("dynamicShifts", JSON.stringify(dynamicShifts));
  renderDynamic();
  scheduleNotifications();
}

function renderDynamic() {
  const list = document.getElementById("dynamicList");
  list.innerHTML = "";

  dynamicShifts.forEach(s => {
    const d = document.createElement("div");
    d.classList.add("shift-item");
    d.textContent = `${s.date}: ${s.start} → ${s.end}`;
    list.appendChild(d);
  });
}
renderDynamic();

function updateReminder() {
  const value = parseInt(document.getElementById("reminderTime").value);
  reminderMinutes = value;
  localStorage.setItem("reminderMinutes", value);
  alert("Reminder time updated!");
  scheduleNotifications();
}

async function requestNotifications() {
  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }
}
requestNotifications();

function scheduleNotifications() {
  if (Notification.permission !== "granted") return;

  navigator.serviceWorker.ready.then(reg => {
    reg.active.postMessage({
      action: "schedule",
      weekly: JSON.parse(localStorage.getItem("weeklySchedule") || "{}"),
      dynamic: dynamicShifts,
      reminderMinutes
    });
  });
}
