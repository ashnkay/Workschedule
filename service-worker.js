self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());

let reminderMinutes = 60;

self.addEventListener("message", e => {
  if (e.data.action === "schedule") {
    const { weekly, dynamic, reminderMinutes: r } = e.data;
    reminderMinutes = r;
    schedule(weekly, dynamic);
  }
});

function schedule(weekly, dynamic) {
  setInterval(() => checkSchedules(weekly, dynamic), 60000);
}

function checkSchedules(weekly, dynamic) {
  const now = new Date();
  const day = now.toLocaleString("en-US", { weekday: "long" });
  const today = weekly[day];

  if (today && today.start) {
    notifyIfTime(today.start, "Weekly Shift Today!");
  }

  dynamic.forEach(shift => {
    if (shift.date === now.toISOString().slice(0, 10)) {
      notifyIfTime(shift.start, "Shift Today!");
    }
  });
}

function notifyIfTime(startTime, title) {
  const now = new Date();
  const shift = new Date();

  const [h, m] = startTime.split(":");
  shift.setHours(h);
  shift.setMinutes(m);

  const diff = (shift - now) / 60000;

  if (diff > 0 && diff < reminderMinutes + 1) {
    self.registration.showNotification(title, {
      body: `Shift begins at ${startTime}`,
      icon: "/Workschedule/icon.png"
    });
  }
}
