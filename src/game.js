const params   = new URLSearchParams(location.search);
const mapData  = JSON.parse(atob(params.get('map')));
console.log(mapData);

const rows = mapData.dimensions[1];
const cols = mapData.dimensions[0];

let world = Array.from({ length: rows }, (_, r) =>
  files[mapData.data].slice(r * cols, (r + 1) * cols));

let worldSize;

const colors = {
  "-1": "#4287f5",  // water
  "0": "#ffffff",   // unoccupied
  "1": "#0000aa",
  "2": "#00aa00",
  "3": "#00aaaa",
  "4": "#aa0000",
  "5": "#aa00aa",
  "6": "#aaaa00",
  "7": "#aaaaaa",
  "8": "#000055",
  "9": "#0000ff",
  "10": "#00aa55",
  "11": "#00aaff",
  "12": "#aa0055",
  "13": "#aa00ff",
  "14": "#aaaa55",
  "15": "#aaaaff",
  "16": "#005500",
  "17": "#0055aa",
  "18": "#00ff00",
  "19": "#00ffaa",
  "20": "#aa5500",
  "21": "#aa55aa",
  "22": "#aaff00",
  "23": "#aaffaa",
  "24": "#005555",
  "25": "#0055ff",
  "26": "#00ff55",
  "27": "#00ffff",
  "28": "#aa5555",
  "29": "#aa55ff",
  "30": "#aaff55",
  "31": "#aaffff",
  "32": "#550000",
  "33": "#5500aa",
  "34": "#55aa00",
  "35": "#55aaaa",
  "36": "#ff0000",
  "37": "#ff00aa",
  "38": "#ffaa00",
  "39": "#ffaaaa",
  "40": "#550055",
  "41": "#5500ff",
  "42": "#55aa55",
  "43": "#55aaff",
  "44": "#ff0055",
  "45": "#ff00ff",
  "46": "#ffaa55",
  "47": "#ffaaff",
  "48": "#555500",
  "49": "#5555aa",
  "50": "#55ff00",
  "51": "#55ffaa",
  "52": "#ff5500",
  "53": "#ff55aa",
  "54": "#ffff00",
  "55": "#ffffaa",
  "56": "#555555",
  "57": "#5555ff",
  "58": "#55ff55",
  "59": "#55ffff",
  "60": "#ff5555",
  "61": "#ff55ff",
  "62": "#ffff55"
};

let countries = {}
for(const country of Object.keys(colors)) {
    countries[country] = {
        name: "N/A",
        size: "N/A",
        enemies: [],
        allies: [],
        capital: [],
        coins: 0
    }
}

const mapCanvas = document.createElement('canvas');
mapCanvas.width  = cols;
mapCanvas.height = rows;
const mapCtx = mapCanvas.getContext('2d');

for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    const idx = r * cols + c;
    let colHex = colors[world[r][c]];
    mapCtx.fillStyle = colHex;
    mapCtx.fillRect(c, r, 1, 1);
  }
}

function lighten(hex, amt = 0.1) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255,
      g = (n >> 8) & 255,
      b =  n       & 255;
  r = Math.round(r + (255 - r) * amt);
  g = Math.round(g + (255 - g) * amt);
  b = Math.round(b + (255 - b) * amt);
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

const canvas = document.getElementById('canvas');
const ctx    = canvas.getContext('2d', { alpha: false });

const cam = { x: 0, y: 0, scale: 1 };

function render() {
  ctx.setTransform(cam.scale, 0, 0, cam.scale, -cam.x * cam.scale, -cam.y * cam.scale);
  ctx.imageSmoothingEnabled = false;

  const w = canvas.width  / cam.scale;
  const h = canvas.height / cam.scale;

  ctx.fillStyle = '#4287f5';
  ctx.fillRect(cam.x, cam.y, w, h);

  ctx.drawImage(
    mapCanvas,
    cam.x, cam.y, w, h,
    cam.x, cam.y, w, h 
  );

  const visLeft   = Math.max(0, Math.floor(cam.x));
  const visTop    = Math.max(0, Math.floor(cam.y));
  const visRight  = Math.min(cols, Math.ceil(cam.x + w));
  const visBottom = Math.min(rows, Math.ceil(cam.y + h));

  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';

  for (let r = visTop; r < visBottom; r++) {
    for (let c = visLeft; c < visRight; c++) {
      const id = world[r][c];
      if (id === -1 || id === 0) continue;

      let border = false;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const nid = world[nr][nc];
        if (nid !== id) { border = true; break; }
      }
      if (border) ctx.fillRect(c, r, 1, 1);
    }
  }

  ctx.fillStyle = "#ffffff";

for (const country in countries) {
  const cap = countries[country].capital;
  if (cap.length === 0) continue;

  const [row, col] = cap;
  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    countries[country].capital = [];
    continue;
  }

  const countryId = Number(country);
  if (world[row][col] !== countryId) {
    countries[country].capital = [];
    continue;
  }

  // World coordinates center of tile
  const x = col + 0.5;
  const y = row + 0.5;

  // Star drawing function (same as before)
  function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    let step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
  }

  ctx.fillStyle = "#ffffff";    // fill color
  ctx.strokeStyle = colors[world[row][col]];  // outline color
  ctx.lineWidth = 0.5 / (cam.scale); // outline thickness scales inversely so it stays visible

  const outerRadius = 1.5;  // 1.5 times half tile size (0.5) = 0.75 world units radius
  const innerRadius = outerRadius / 2;

  drawStar(ctx, x, y, 5, outerRadius, innerRadius);
  ctx.fill();
  ctx.stroke();
}
updateTooltip();
}

canvas.addEventListener('wheel', e => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();
  const cx = (e.clientX - rect.left) * (canvas.width  / rect.width);
  const cy = (e.clientY - rect.top)  * (canvas.height / rect.height);

  const worldX = cam.x + cx / cam.scale;
  const worldY = cam.y + cy / cam.scale;

  const zoom = e.deltaY < 0 ? 1.1 : 1 / 1.1;
  cam.scale = Math.min(Math.max(cam.scale * zoom, 0.5), 8);

  cam.x = worldX - cx / cam.scale;
  cam.y = worldY - cy / cam.scale;

  render();
}, { passive: false });

const keysPressed = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  w: false,
  a: false,
  s: false,
  d: false,
};

window.addEventListener('keydown', e => {
  const key = e.key.toLowerCase();
  if (key in keysPressed) {
    keysPressed[key] = true;
    e.preventDefault();
  }
});

window.addEventListener('keyup', e => {
  const key = e.key.toLowerCase();
  if (key in keysPressed) {
    keysPressed[key] = false;
    e.preventDefault();
  }
});

function updateCamera() {
  const step = 1 / cam.scale;
  let moved = false;

  if (keysPressed.ArrowUp || keysPressed.w) {
    cam.y -= step;
    moved = true;
  }
  if (keysPressed.ArrowDown || keysPressed.s) {
    cam.y += step;
    moved = true;
  }
  if (keysPressed.ArrowLeft || keysPressed.a) {
    cam.x -= step;
    moved = true;
  }
  if (keysPressed.ArrowRight || keysPressed.d) {
    cam.x += step;
    moved = true;
  }

  if (moved) render();

  requestAnimationFrame(updateCamera);
}

const tooltip = document.createElement('div');

Object.assign(tooltip.style, {
    position: 'fixed',
    padding: '4px 8px',
    opacity: 0.75,
    color: '#fff',
    font: '12px sans-serif',
    borderRadius: '4px',
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
    transform: 'translate(-50%, -130%)',
    display: 'none',
    zIndex: 1000
});

document.body.appendChild(tooltip);

const mouseState = { x: 0, y: 0, inside: false };

canvas.addEventListener('mousemove', e => {
  mouseState.x = e.clientX;      // store screen‑pixel coords
  mouseState.y = e.clientY;
  mouseState.inside = true;
  updateTooltip();               // update immediately while moving
});

canvas.addEventListener('mouseleave', () => {
  mouseState.inside = false;
  tooltip.style.display = 'none';
});

function updateTooltip() {
  if (!mouseState.inside) return;               // pointer off map

  const rect   = canvas.getBoundingClientRect();
  const cx     = (mouseState.x - rect.left) * (canvas.width  / rect.width);
  const cy     = (mouseState.y - rect.top)  * (canvas.height / rect.height);
  const worldX = cam.x + cx / cam.scale;
  const worldY = cam.y + cy / cam.scale;
  const col    = Math.floor(worldX);
  const row    = Math.floor(worldY);

  // out of bounds?
  if (row < 0 || row >= rows || col < 0 || col >= cols) {
    tooltip.style.display = 'none';
    return;
  }

  /* determine label */
  let label = '';
  const id = world[row][col];

  if (id === -1){
    label = 'Water';
    tooltip.style.background = `color-mix(in hsl, ${colors["-1"]}, black 20%)`;
  }
  else if (id === 0){
    label = '';   // empty land
  }
  else {
    const info = countries[String(id)];
    label = info && info.name !== 'N/A' ? `${info.name} - $${(info.coins).toLocaleString('en-US')}` : '';  // fall back to blank if unset
    tooltip.style.background = `color-mix(in hsl, ${colors[String(id)]}, black 20%)`;
  }

  if (label) {
    tooltip.textContent  = label;
    tooltip.style.left   = `${mouseState.x}px`;
    tooltip.style.top    = `${mouseState.y}px`;
    tooltip.style.display = 'block';
  } else {
    tooltip.style.display = 'none';
  }
}

canvas.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
});

requestAnimationFrame(updateCamera);

render();