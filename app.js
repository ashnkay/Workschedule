// Convert 12hr to 24hr
function convertTo24(time) {
  const match = time.match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
  if (!match) return null;

  let hour = parseInt(match[1]);
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const ampm = match[3].toLowerCase();

  if (ampm === "pm" && hour !== 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  return { hour, minutes };
}

// Load saved schedule
window.onload = () => {
  const saved = localStorage.getItem("schedule");
  if (!saved) return;

  const data = JSON.parse(saved);

  document.getElementById("sun").value = data.sun;
  document.getElementById("mon").value = data.mon;
  document.getElementById("tue").value = data.tue;
  document.getElementById("wed").value = data.wed;
  document.getElementById("thu").value = data.thu;
  document.getElementById("fri").value = data.fri;
  document.getElementById("sat").value = data.sat;
  document.getElementById("notifyTime").value = data.notifyTime;
};

// Save & schedule notifications
function saveSchedule() {
  const schedule = {
    sun: sun.value,
    mon: mon.value,
    tue: tue.value,
    wed: wed.value,
    thu: thu.value,
    fri: fri.value,
    sat: sat.value,
    notifyTime: parseInt(document.getElementById("notifyTime").value)
  };

  localStorage.setItem("schedule", JSON.stringify(schedule));
  scheduleNotifications(schedule);

  alert("Saved!");
}

// Notification logic
function scheduleNotifications(schedule) {
  if (!("Notification" in window)) return;

  Notification.requestPermission();

  const days = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  days.forEach((day, dayIndex) => {
    const shift = schedule[day];
    if (!shift || shift.toLowerCase() === "off") return;

    let startText = shift.split("-")[0].trim();
    let startTime = convertTo24(startText);
    if (!startTime) return;

    const remindMinutes = schedule.notifyTime || 60;

    const now = new Date();
    let target = new Date();
    target.setDate(now.getDate() + ((dayIndex - now.getDay() + 7) % 7));
    target.setHours(startTime.hour);
    target.setMinutes(startTime.minutes);
    target.setSeconds(0);
    target.setMilliseconds(0);

    target = new Date(target.getTime() - remindMinutes * 60000);

    const delay = target.getTime() - now.getTime();
    if (delay <= 0) return;

    setTimeout(() => {
      new Notification("Shift Reminder", {
        body: `Your shift starts in ${remindMinutes} minutes.`
      });
    }, delay);
  });
}
