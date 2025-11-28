/* app.js — GitHub Pages ready
   - Stores schedule in localStorage under 'workSchedule_v1'
   - Schedules reminders while the site is active (setTimeout)
   - Uses serviceWorkerRegistration.showNotification when possible
*/

const DAYS = [
  {id:'sun', name:'Sunday'},
  {id:'mon', name:'Monday'},
  {id:'tue', name:'Tuesday'},
  {id:'wed', name:'Wednesday'},
  {id:'thu', name:'Thursday'},
  {id:'fri', name:'Friday'},
  {id:'sat', name:'Saturday'}
];

const DEFAULT_REMINDER_MIN = 30;
let scheduledTimers = [];

document.addEventListener('DOMContentLoaded', () => {
  buildTable();
  loadSchedule();
  document.getElementById('save-btn').addEventListener('click', saveSchedule);
  document.getElementById('clear-btn').addEventListener('click', clearAll);
});

function buildTable() {
  const tbody = document.querySelector('#schedule-table tbody');
  tbody.innerHTML = '';
  for (const day of DAYS) {
    const tr = document.createElement('tr');
    tr.dataset.day = day.id;

    const tdDay = document.createElement('td');
    tdDay.className = 'day';
    tdDay.textContent = day.name + ':';
    tr.appendChild(tdDay);

    const tdShift = document.createElement('td');
    const controls = document.createElement('div');
    controls.className = 'controls';

    const timeWrap = document.createElement('div');
    timeWrap.className = 'time-range';
    const start = document.createElement('input');
    start.type = 'time';
    start.className = 'start';
    start.value = '';
    const dash = document.createElement('span'); dash.textContent = '—';
    const end = document.createElement('input');
    end.type = 'time';
    end.className = 'end';
    end.value = '';

    timeWrap.appendChild(start);
    timeWrap.appendChild(dash);
    timeWrap.appendChild(end);

    const offBtn = document.createElement('button');
    offBtn.className = 'off-btn off';
    offBtn.textContent = 'OFF';
    offBtn.setAttribute('aria-pressed','true');

    offBtn.addEventListener('click', () => {
      const isOff = offBtn.classList.toggle('off');
      offBtn.textContent = isOff ? 'OFF' : 'ON';
      if (!isOff) {
        // turned ON
        if (!start.value) start.value = '09:00';
        if (!end.value) end.value = '17:00';
      } else {
        start.value = '';
        end.value = '';
      }
      scheduleAllReminders();
    });

    controls.appendChild(timeWrap);
    controls.appendChild(offBtn);
    tdShift.appendChild(controls);
    tr.appendChild(tdShift);

    const tdReminder = document.createElement('td');
    const remWrap = document.createElement('div');
    remWrap.className = 'reminder';
    const label = document.createElement('label');
    label.textContent = 'REMINDER:';
    label.style.fontWeight='700';
    label.style.marginRight='8px';

    const sel = document.createElement('select');
    sel.className = 'rem-select';
    const options = [
      {v:5,t:'5 mins'},
      {v:10,t:'10 mins'},
      {v:15,t:'15 mins'},
      {v:30,t:'30 mins'},
      {v:60,t:'60 mins'},
      {v:120,t:'120 mins'}
    ];
    for (const o of options) {
      const opt = document.createElement('option');
      opt.value = o.v;
      opt.textContent = o.t;
      if (o.v === DEFAULT_REMINDER_MIN) opt.selected = true;
      sel.appendChild(opt);
    }

    remWrap.appendChild(label);
    remWrap.appendChild(sel);
    tdReminder.appendChild(remWrap);
    tr.appendChild(tdReminder);

    tbody.appendChild(tr);
  }
}

function saveSchedule() {
  const data = {};
  for (const day of DAYS) {
    const tr = document.querySelector(`tr[data-day="${day.id}"]`);
    const start = tr.querySelector('.start').value;
    const end = tr.querySelector('.end').value;
    const offBtn = tr.querySelector('.off-btn');
    const isOff = offBtn.classList.contains('off');
    const rem = parseInt(tr.querySelector('.rem-select').value,10);
    data[day.id] = {start,end,isOff,rem};
  }
  localStorage.setItem('workSchedule_v1', JSON.stringify(data));
  scheduleAllReminders();
  flashSaved();
}

function loadSchedule() {
  const raw = localStorage.getItem('workSchedule_v1');
  if (!raw) return;
  const data = JSON.parse(raw);
  for (const day of DAYS) {
    if (!data[day.id]) continue;
    const tr = document.querySelector(`tr[data-day="${day.id}"]`);
    const {start,end,isOff,rem} = data[day.id];
    tr.querySelector('.start').value = start || '';
    tr.querySelector('.end').value = end || '';
    const offBtn = tr.querySelector('.off-btn');
    if (isOff) {
      offBtn.classList.add('off');
      offBtn.textContent = 'OFF';
    } else {
      offBtn.classList.remove('off');
      offBtn.textContent = 'ON';
    }
    tr.querySelector('.rem-select').value = rem || DEFAULT_REMINDER_MIN;
  }
  scheduleAllReminders();
}

function clearAll() {
  if (!confirm('Clear all saved schedule?')) return;
  localStorage.removeItem('workSchedule_v1');
  buildTable();
  scheduleAllReminders();
}

function flashSaved() {
  const btn = document.getElementById('save-btn');
  const old = btn.textContent;
  btn.textContent = 'Saved ✓';
  setTimeout(()=> btn.textContent = old,1200);
}

function scheduleAllReminders() {
  for (const t of scheduledTimers) clearTimeout(t);
  scheduledTimers = [];

  const raw = localStorage.getItem('workSchedule_v1');
  if (!raw) return;
  const data = JSON.parse(raw);
  const now = new Date();

  for (const [i,day] of DAYS.entries()) {
    const cfg = data[day.id];
    if (!cfg) continue;
    if (cfg.isOff) continue;
    if (!cfg.start) continue;

    const [h,m] = cfg.start.split(':').map(s => parseInt(s,10));
    if (isNaN(h)) continue;

    const target = nextWeekdayDate(i, h, parseInt(m||0,10));
    const remMinutes = parseInt(cfg.rem || DEFAULT_REMINDER_MIN,10);
    const remindAt = new Date(target.getTime() - remMinutes * 60000);

    if (remindAt <= now) {
      remindAt.setTime(remindAt.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const ms = remindAt.getTime() - now.getTime();
    const timerId = setTimeout(() => {
      showReminderNotification(day.name, cfg.start, cfg.end, remMinutes);
      scheduleAllReminders();
    }, ms);
    scheduledTimers.push(timerId);
    console.log(`Scheduled reminder for ${day.name} at ${remindAt.toString()}`);
  }
}

function nextWeekdayDate(weekdayIndex, hour=9, minute=0) {
  const now = new Date();
  const todayIndex = now.getDay();
  let diff = weekdayIndex - todayIndex;
  if (diff < 0) diff += 7;
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (diff === 0 && d <= now) diff = 7;
  const target = new Date(d.getTime() + diff * 24 * 60 * 60 * 1000);
  return target;
}

async function showReminderNotification(dayName, startTime, endTime, remMinutes) {
  const title = `Shift reminder — ${dayName}`;
  const body = `Shift ${startTime}${endTime ? ` - ${endTime}` : ''} starts in ${remMinutes} minutes.`;
  const icon = './logo.png';

  try {
    if (navigator.serviceWorker && navigator.serviceWorker.ready) {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification(title, {
        body,
        icon,
        badge: icon,
        data: {dayName, startTime, endTime}
      });
      return;
    }
  } catch (err) {
    console.warn('service worker notify failed', err);
  }

  if (window.Notification && Notification.permission === 'granted') {
    new Notification(title, {body, icon});
  } else {
    console.log('Notification blocked or unavailable:', title, body);
  }
}

/* Auto-save after user stops typing */
document.addEventListener('input', debounce(() => {
  saveSchedule();
}, 700));

function debounce(fn, t=300){
  let id;
  return (...args)=> {
    clearTimeout(id);
    id = setTimeout(()=>fn(...args), t);
  };
}
