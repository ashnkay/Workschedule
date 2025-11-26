const scheduleData = {
  Monday: ["9:00 AM – 5:00 PM", "Meeting 2 PM"],
  Tuesday: ["10:00 AM – 6:00 PM"],
  Wednesday: ["9:00 AM – 5:00 PM"],
  Thursday: ["9:00 AM – 5:00 PM"],
  Friday: ["9:00 AM – 3:00 PM"]
};

const scheduleContainer = document.getElementById("schedule");

function renderSchedule() {
  scheduleContainer.innerHTML = "";
  for (const day in scheduleData) {
    const card = document.createElement("div");
    card.classList.add("day-card");

    const dayTitle = document.createElement("h2");
    dayTitle.textContent = day;
    card.appendChild(dayTitle);

    const list = document.createElement("ul");
    scheduleData[day].forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;
      list.appendChild(li);
    });
    card.appendChild(list);

    const addBtn = document.createElement("button");
    addBtn.textContent = "Add Shift";
    addBtn.onclick = () => {
      const newShift = prompt(`Add a new shift for ${day}:`);
      if (newShift) {
        scheduleData[day].push(newShift);
        renderSchedule();
      }
    };
    card.appendChild(addBtn);

    scheduleContainer.appendChild(card);
  }
}

renderSchedule();

window.addEventListener("beforeunload", () => {
  localStorage.setItem("scheduleData", JSON.stringify(scheduleData));
});
const saved = localStorage.getItem("scheduleData");
if (saved) {
  Object.assign(scheduleData, JSON.parse(saved));
  renderSchedule();
}
