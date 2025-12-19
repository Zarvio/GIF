let player;
let duration = 0;

function getID(url) {
  const r = /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([^?&]+)/;
  const m = url.match(r);
  return m ? m[1] : null;
}

function formatTime(sec) {
  sec = Math.floor(sec);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2,"0")}:${s.toString().padStart(2,"0")}`;
}

function loadVideo() {
  const url = document.getElementById("url").value.trim();
  const id = getID(url);
  if (!id) { alert("Invalid YouTube link"); return; }

  document.getElementById("player").innerHTML = `<div id="yt"></div>`;

  player = new YT.Player("yt", {
    height: "360",
    width: "100%", // mobile friendly
    videoId: id,
    events: { onReady: onPlayerReady }
  });
}

function onPlayerReady() {
  duration = Math.floor(player.getDuration());
  const start = document.getElementById("start");
  const end = document.getElementById("end");
  const startInput = document.getElementById("startInput");
  const endInput = document.getElementById("endInput");

  start.max = duration; end.max = duration;
  start.value = 0; end.value = duration;
  startInput.value = 0; endInput.value = duration;

  document.getElementById("startLabel").innerText = formatTime(0);
  document.getElementById("endLabel").innerText = formatTime(duration);
  document.getElementById("controls").style.display = "block";

  // Sync range sliders with inputs
  start.oninput = () => {
    startInput.value = start.value;
    document.getElementById("startLabel").innerText = formatTime(start.value);
  };
  end.oninput = () => {
    endInput.value = end.value;
    document.getElementById("endLabel").innerText = formatTime(end.value);
  };

  startInput.onchange = () => { start.value = startInput.value; start.oninput(); };
  endInput.onchange = () => { end.value = endInput.value; end.oninput(); };
}

function trim() {
  const url = document.getElementById("url").value.trim();
  const start = document.getElementById("start").value;
  const end = document.getElementById("end").value;

  if (+start >= +end) { alert("Start must be less than End"); return; }

  const progressDiv = document.getElementById("progress");
  progressDiv.innerText = "Preparing download...";

  // Create temporary download link
  const a = document.createElement("a");
  a.download = "trimmed.mp4";
  a.href = `/trim?url=${encodeURIComponent(url)}&start=${start}&end=${end}`;
  a.click();

  progressDiv.innerText = "Download started!";

  // Optional: live progress from backend (if you implement it)
  // Example: backend can send SSE or fetch /progress endpoint
}
