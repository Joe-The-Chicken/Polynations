const bottomDiv = document.getElementById('bottom');
const paintSelector = document.getElementById('paintingChecker');

let painting = false;
let paintSelected = false;

const leftBtn = document.getElementById('btnl');
const rightBtn = document.getElementById('btnr');
const eraseBtn = document.getElementById('btne');
const waterBtn = document.getElementById('btnw');
const paintingBtn = document.getElementById('btnpn');
const display = document.getElementById('color');

const nme = document.getElementById('lname');
const size = document.getElementById('lsize');

const minId = 1;
const maxId = 62;
let selectedId = minId;
let lastColor = 1;

function refreshSwatch() {
  display.style.background = colors[selectedId];
  waterBtn.className = "";
  eraseBtn.className = "";

  refreshStats()
}

function refreshStats() {
    nme.textContent = `Name: ${countries[selectedId].name}`;
    if(countries[selectedId].size == "N/A") {
      size.textContent = `Size: ${countries[selectedId].size}`;
    } else if(Math.floor((countries[selectedId].size/worldSize) * 10000) / 100 < 0.01) {
      size.textContent = `Size: ${countries[selectedId].size} (<0.01%)`;
    } else {
      size.textContent = `Size: ${countries[selectedId].size} (${Math.floor((countries[selectedId].size/worldSize) * 10000) / 100}%)`;
    }
}

refreshSwatch();

// ---- Arrow button behavior
leftBtn.addEventListener('click', () => {
  do {
    selectedId = selectedId <= minId ? maxId : selectedId - 1;
  } while (!colors[selectedId] && selectedId !== 0);
  refreshSwatch();
});

rightBtn.addEventListener('click', () => {
  if(selectedId < 1) {
    selectedId = lastColor;
  }

  selectedId = selectedId >= maxId ? minId : selectedId + 1;

  lastColor = selectedId;
  refreshSwatch();
});

// ---- Eraser (color ID 0)
eraseBtn.addEventListener('click', () => {
  if(!paintSelected) {
    return;
  }
  if(selectedId == 0) {
    selectedId = lastColor;
    refreshSwatch();
    return;
  }

  eraseBtn.className = "selectedButton";
  waterBtn.className = "";
  selectedId = 0;
});

waterBtn.addEventListener('click', () => {
  if(!paintSelected) {
    return;
  }
  if(selectedId == -1) {
    selectedId = lastColor;
    refreshSwatch();
    return;
  }

  waterBtn.className = "selectedButton";
  eraseBtn.className = "";
  selectedId = -1;
});

paintingBtn.addEventListener('click', () => {
  paintSelected = !paintSelected;
  if(paintSelected) {
    paintingBtn.className = "selectedButton";
  } else {
    paintingBtn.className = "";
  }
});

/*************************************************************************
 *  CLICK‑TO‑PAINT (ignores water ‑1)                                   *
 *************************************************************************/

function paintAtEvent(e) {
  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (canvas.width  / rect.width);
  const cy = (e.clientY - rect.top)  * (canvas.height / rect.height);

  const worldX = cam.x + cx / cam.scale;
  const worldY = cam.y + cy / cam.scale;

  const col = Math.floor(worldX);
  const row = Math.floor(worldY);

  if(!paintSelected) {
    if(world[row][col] <= 0) {
      return;
    }
    selectedId = world[row][col];
    refreshSwatch();
    return;
  }

  if (row < 0 || row >= world.length || col < 0 || col >= world[0].length) return;
  if (world[row][col] === -1 && selectedId > 0) return; // skip water

  if (world[row][col] === selectedId) return; // already painted

  world[row][col] = selectedId;

  mapCtx.fillStyle = colors[selectedId];
  mapCtx.fillRect(col, row, 1, 1);

  if(selectedId > 0) {
    if(countries[selectedId].name == "N/A") {
      countries[selectedId].name = generateName();
    }

    if(countries[selectedId].capital.length == 0) {
      countries[selectedId].capital = [row,col];
    }
  }

  render();
}

canvas.addEventListener('mousedown', e => {
  // Left button starts painting
  if (e.button === 0) {
    painting = true;
    paintAtEvent(e);
  }
});

canvas.addEventListener('mousemove', e => {
  if (painting && paintSelected) {
    paintAtEvent(e);
  }
});

window.addEventListener('mouseup', e => {
  painting = false;
});