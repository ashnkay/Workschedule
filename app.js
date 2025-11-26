const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

let schedule = JSON.parse(localStorage.getItem("kaylaSchedule")) || {
  Sunday:{status:"Off",time:"",notify:60},
  Monday:{status:"Work",time:"12pm - 5pm",notify:60},
  Tuesday:{status:"Work",time:"6am - 12pm",notify:60},
  Wednesday:{status:"Work",time:"10pm - 6am",notify:60},
  Thursday:{status:"Off",time:"",notify:60},
  Friday:{status:"Off",time:"",notify:60},
  Saturday:{status:"Off",time:"",notify:60},
};

function save(){ localStorage.setItem("kaylaSchedule", JSON.stringify(schedule)); }

/* ---------------- RENDER WEEK ---------------- */
function renderWeek(){
  const grid = document.getElementById("weekGrid");
  grid.innerHTML = "";
  days.forEach(d=>{
    const card = document.createElement("div");
    card.className="day-card";
    card.onclick = () => toggleStatus(d);
    card.innerHTML = `
      <div class="day-name">${d}</div>
      <div class="day-status">${schedule[d].status}</div>
    `;
    grid.appendChild(card);
  });
}

/* --------------- RENDER DETAILS -------------- */
function renderDetails(){
  const list = document.getElementById("dayList");
  const box = document.getElementById("scheduleBox");

  list.innerHTML = days.map(d=>`<div class="list-day">${d}</div>`).join("");

  box.innerHTML = days.map(d=>{
    return `
      <div class="slot-row">
        <div class="slot-name">${d}</div>
        <input class="slot-time" id="time-${d}" value="${schedule[d].time}" placeholder="12pm - 5pm">
        <select class="notify-control" id="notify-${d}">
          <option value="15">15 min</option>
          <option value="30">30 min</option>
          <option value="60">1 hour</option>
          <option value="120">2 hours</option>
        </select>
        <button class="tiny-btn" onclick="saveDay('${d}')">Save</button>
      </div>
    `;
  }).join("");

  days.forEach(d=>{
    document.getElementById("notify-"+d).value = schedule[d].notify;
  });
}

/* ---------------- Toggle Work/Off ---------------- */
function toggleStatus(day){
  schedule[day].status = schedule[day].status === "Work" ? "Off" : "Work";
  save();
  renderWeek();
}

/* ---------------- Save Day ---------------- */
function saveDay(day){
  const t = document.getElementById("time-"+day).value;
  const n = parseInt(document.getElementById("notify-"+day).value);
  schedule[day].time = t;
  schedule[day].notify = n;
  save();
}

/* ----------------- Notification Logic ----------------- */

if (Notification && Notification.permission !== "granted") {
  Notification.requestPermission();
}

function convertTo24(t){
  const parts = t.match(/(\d+)(?::(\d+))?\s*(am|pm)/i);
  if(!parts) return null;

  let hour = parseInt(parts[1]);
  let minutes = parts[2] ? parseInt(parts[2]) : 0;
  const mer = parts[3].toLowerCase();

  if(mer==="pm" && hour!==12) hour+=12;
  if(mer==="am" && hour===12) hour=0;

  return {hour,minutes};
}

function parseTimeRange(str){
  if(!str.includes("-")) return null;
  let [start, end] = str.split("-");
  return {
    start: convertTo24(start.trim()),
    end: convertTo24(end.trim())
  };
}

let notifiedToday = false;

function checkNotifications(){
  const now = new Date();
  const dayName = days[now.getDay()];
  const config = schedule[dayName];

  if(config.status !== "Work" || !config.time) return;

  const parsed = parseTimeRange(config.time);
  if(!parsed) return;

  const notifyBefore = config.notify;

  const start = new Date();
  start.setHours(parsed.start.hour, parsed.start.minutes, 0, 0);

  const diff = (start - now) / 1000 / 60;

  if(diff > 0 && diff <= notifyBefore){
    sendNotification(dayName, config.time);
  }
}

function sendNotification(day, time){
  if(notifiedToday) return;

  notifiedToday = true;
  new Notification("Shift Reminder", {
    body: `${day}: Your shift starts at ${time}`,
  });
}

// reset daily
setInterval(()=>{
  const now = new Date();
  if(now.getHours()===0 && now.getMinutes()===0){
    notifiedToday = false;
  }
}, 60000);

// check every minute
setInterval(checkNotifications, 60000);

/* INIT */
renderWeek();
renderDetails();
