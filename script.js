// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyDrin5vKcED1qoiopkyiDPlvqmwlq_QeMM",
  authDomain: "iiot-bb042.firebaseapp.com",
  databaseURL: "https://iiot-bb042-default-rtdb.firebaseio.com",
  projectId: "iiot-bb042",
  storageBucket: "iiot-bb042.firebasestorage.app",
  messagingSenderId: "100326042231",
  appId: "1:100326042231:web:92801886f40c88e21ab472",
  measurementId: "G-BXQB4RTR4S"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Update current date & time
function updateDateTime() {
  const now = new Date();
  const options = { weekday:'long', year:'numeric', month:'short', day:'numeric' };
  const dateStr = now.toLocaleDateString(undefined, options);
  const timeStr = now.toLocaleTimeString();
  document.getElementById('current-datetime').textContent = `${dateStr} | ${timeStr}`;
}
updateDateTime();
setInterval(updateDateTime, 1000);

// Get current day/hour
function getCurrentDayHour() {
  const now = new Date();
  let day = now.getDay();
  day = day === 0 ? 7 : day;
  const hour = now.getHours();
  return { day, hour, now };
}

// Load live current slot values from Firebase
function loadCurrentValues() {
  db.ref("Current").on("value", snapshot => {
    const data = snapshot.val();
    if(data){
      const slot1Status = parseInt(data.slot1) === 1 ? "Occupied" : "Free";
      const slot2Status = parseInt(data.slot2) === 1 ? "Occupied" : "Free";

      const slot1Element = document.getElementById("current-slot1");
      const slot2Element = document.getElementById("current-slot2");

      slot1Element.textContent = slot1Status;
      slot2Element.textContent = slot2Status;

      slot1Element.className = parseInt(data.slot1) === 1 ? "occupied" : "free";
      slot2Element.className = parseInt(data.slot2) === 1 ? "occupied" : "free";
    }
  });
}
loadCurrentValues();

// Load predicted occupancy
let hoursToShow = 5;
function loadPredictions() {
  const { day, hour, now } = getCurrentDayHour();
  const tbody = document.getElementById('prediction-table').querySelector('tbody');
  tbody.innerHTML = '';

  db.ref(`Predictions/Day${day}`).get().then(snapshot => {
    const dayData = snapshot.val();
    for(let i=0; i<hoursToShow; i++){
      const futureTime = new Date(now);
      futureTime.setHours(hour+i,0,0,0);
      const nextHour = new Date(futureTime);
      nextHour.setHours(nextHour.getHours()+1);

      const hourIndex = futureTime.getHours();

      if(dayData[`Hour${hourIndex}`]){
        const slot1 = dayData[`Hour${hourIndex}`].Slot1;
        const slot2 = dayData[`Hour${hourIndex}`].Slot2;

        const row = document.createElement('tr');
        const timeStr = `${futureTime.toLocaleDateString()} ${futureTime.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${nextHour.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;
        row.innerHTML = `<td>${timeStr}</td>
                         <td class="${slot1==='Occupied'?'occupied':'free'}">${slot1}</td>
                         <td class="${slot2==='Occupied'?'occupied':'free'}">${slot2}</td>`;
        tbody.appendChild(row);
      }
    }
  });
}
loadPredictions();

// Load more/less
document.getElementById('load-more').addEventListener('click', ()=>{
  hoursToShow += 5;
  loadPredictions();
});
document.getElementById('load-less').addEventListener('click', ()=>{
  hoursToShow = Math.max(5, hoursToShow-5);
  loadPredictions();
});

// Refresh predictions every minute
setInterval(loadPredictions, 60000);

// --- Chart Section ---
let occupancyChart;
function loadChart() {
  const { day } = getCurrentDayHour();
  db.ref(`Predictions/Day${day}`).get().then(snapshot => {
    const data = snapshot.val();
    if(!data) return;

    const labels = [];
    const slot1Data = [];
    const slot2Data = [];

    for(let i=0;i<24;i++){
      if(data[`Hour${i}`]){
        labels.push(i+":00");
        slot1Data.push(data[`Hour${i}`].Slot1==='Occupied'?1:0);
        slot2Data.push(data[`Hour${i}`].Slot2==='Occupied'?1:0);
      }
    }

    const ctx = document.getElementById('occupancyChart').getContext('2d');
    if(occupancyChart) occupancyChart.destroy();

    occupancyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          { label:'Slot 1', data: slot1Data, borderColor:'#f44336', backgroundColor:'rgba(244,67,54,0.2)', fill:true },
          { label:'Slot 2', data: slot2Data, borderColor:'#4caf50', backgroundColor:'rgba(76,175,80,0.2)', fill:true }
        ]
      },
      options: {
        responsive:true,
        plugins:{ legend:{ position:'top' } },
        scales: { y: { min:0, max:1, ticks:{ stepSize:1 } } }
      }
    });
  });
}
loadChart();
setInterval(loadChart,60000);

// --- Fullscreen Chart ---
const modal = document.getElementById("chart-modal");
const fullscreenCtx = document.getElementById("fullscreenChart").getContext("2d");
let fullscreenChart;

document.getElementById("occupancyChart").onclick = function() {
  modal.style.display = "flex";
  if(occupancyChart){
    if(fullscreenChart) fullscreenChart.destroy();
    fullscreenChart = new Chart(fullscreenCtx,{
      type:'line',
      data: JSON.parse(JSON.stringify(occupancyChart.data)),
      options: JSON.parse(JSON.stringify(occupancyChart.options))
    });
  }
};

document.getElementById("close-modal").onclick = function(){
  modal.style.display="none";
  if(fullscreenChart) fullscreenChart.destroy();
};

window.onclick = function(event){
  if(event.target==modal){
    modal.style.display="none";
    if(fullscreenChart) fullscreenChart.destroy();
  }
};
