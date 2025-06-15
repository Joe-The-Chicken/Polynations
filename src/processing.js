let paused = true;
let speedid = 0;
let logs = [];
const pauser = document.getElementById("btnp");
const speeder = document.getElementById("btnsp");
const logger = document.getElementById("logs")

pauser.style.backgroundColor = "#2eff77";
speeder.style.backgroundColor = "gold";

let borderCountries;

function pause() {
    paused = !paused;
    pauser.textContent = pauser.textContent == "GO" ? "STOP" : "GO";
    if(pauser.textContent == "GO") {
        pauser.style.backgroundColor = "#2eff77";
    } else {
        pauser.style.backgroundColor = "#ff2450";
    }
    if(!paused) {
        run();
    }
}

const speedList = [
    1, 2, 3, 5, 10
];

function speed() {
    speedid++;

    if(speedid == speedList.length) {
        speedid = 0;
    }

    speeder.textContent = `${speedList[speedid]}x`;

    if(!paused) {
        run();
    }
}

function findBorderCells(world) {
  borderCountries = {};

  const rows = world.length, cols = world[0].length, list = [];
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = world[r][c];
      if (id === -1 || id === 0) continue;          // skip water / white

      let border = false;
      for (const [dr, dc] of dirs) {
        const nr = r + dr, nc = c + dc;
        if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
        const nid = world[nr][nc];
        if (nid === -1) continue;                   // ignore water neighbour
        if (nid !== id) {
            border = true;
            if(!borderCountries[id]) {
                borderCountries[id] = [];
            }
            if(!borderCountries[id].includes(nid) && nid > 0) {
                borderCountries[id].push(nid);
            }
            break; 
        }
      }
      if (border) list.push([r,c]);
    }
  }
  return list;
}

function processCells() {
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const borderCells = findBorderCells(world); // [[r,c], …]

  for (const [r, c] of borderCells) {
    const attacker = world[r][c];
    const atkCountry = countries[attacker];
    const atkSize = atkCountry.size || 1;

    /* count friendly neighbours of this border pixel */
    let friendCount = 0;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
      if (world[nr][nc] === attacker) friendCount++;
    }

    /* explore neighbours */
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;

      const nid = world[nr][nc];

      /* ---- 1. colonise blank land (white) ----------------------- */
      if (nid === 0) {
        if (Math.random() > 0.5) {
          world[nr][nc] = attacker;
          mapCtx.fillStyle = colors[attacker];
          mapCtx.fillRect(nc, nr, 1, 1);
        }
        continue;
      }

      /* ---- 2. attack enemy territory ---------------------------- */
      if (!atkCountry.enemies.includes(String(nid))) continue;

      const defCountry = countries[nid];
      const defSize = defCountry.size || 1;

      /* compute size‑weighted probability */
      const base       = 0.08;
      const sizeRatio  = atkSize / (atkSize + defSize); // 0..1
      let   chance     = base * friendCount * sizeRatio;

      /* is target the defender's capital? -> 2× harder */
      const cap = defCountry.capital; // [row,col] or undefined
      const isCapital =
        cap && cap[0] === nr && cap[1] === nc;

      if (isCapital) chance *= 0.5;    // 2× more difficult

      if (friendCount >= 2 && Math.random() < chance) {
        /* --- capture succeeds ----------------------------------- */
        if (isCapital) {
          /* wipe the entire defender country to white (0) */
          for (let yy = 0; yy < rows; yy++) {
            for (let xx = 0; xx < cols; xx++) {
              if (world[yy][xx] === nid) {
                world[yy][xx] = 0;
                mapCtx.fillStyle = colors[0];
                mapCtx.fillRect(xx, yy, 1, 1);
              }
            }
          }
          defCountry.size = 0;             // they’re gone
          logg(countries[attacker].name + " has destroyed " + countries[nid].name + "!");
        } else {
          /* normal tile takeover */
          world[nr][nc] = attacker;
          mapCtx.fillStyle = colors[attacker];
          mapCtx.fillRect(nc, nr, 1, 1);
        }
      }
    }
  }

  render();
}

function processRelations() {
    if(Math.random() < 0.002 * Object.keys(borderCountries).length) {
        let c1 = Object.keys(borderCountries)[Math.floor(Math.random() * Object.keys(borderCountries).length)];
        let c2 = Object.keys(borderCountries)[Math.floor(Math.random() * Object.keys(borderCountries).length)];

        if(c1 != c2) {
            if(borderCountries[c1] && borderCountries[c1].includes(parseInt(c2))) {
                if(!countries[c1].allies.includes(c2)) {
                    if(!countries[c1].enemies.includes(c2)) {
                        countries[c1].enemies.push(c2);
                        countries[c2].enemies.push(c1);
                        logg(countries[c1].name + " has declared war on " + countries[c2].name + "!")

                        for(const country of countries[c1].allies) {
                            if(countries[country].allies.includes(c2)) {continue};
                            countries[country].enemies.push(c2)
                            logg(countries[country].name + " has declared war on " + countries[c2].name + "!")
                        }

                        for(const country of countries[c2].allies) {
                            if(countries[country].allies.includes(c1)) {continue};
                            countries[country].enemies.push(c1)
                            logg(countries[country].name + " has declared war on " + countries[c1].name + "!")
                        }
                    }
                }
            }
        }
    }
    if(Math.random() < 0.002 * Object.keys(borderCountries).length) {
        let c1 = Object.keys(borderCountries)[Math.floor(Math.random() * Object.keys(borderCountries).length)];
        let c2 = Object.keys(borderCountries)[Math.floor(Math.random() * Object.keys(borderCountries).length)];

        if(c1 != c2) {
            if(borderCountries[c1] && borderCountries[c1].includes(parseInt(c2))) {
                if(!countries[c1].allies.includes(c2)) {
                    if(!countries[c1].enemies.includes(c2)) {
                        countries[c1].allies.push(c2);
                        countries[c2].allies.push(c1);
                        logg(countries[c1].name + " has become allies with " + countries[c2].name + "!");
                    }
                } else {
                    countries[c1].allies = countries[c1].allies.filter(c => c != c2);
                    countries[c2].allies = countries[c2].allies.filter(c => c != c1);
                    logg(countries[c1].name + " has broken their alliance with " + countries[c2].name + "!");
                }
            }
        }
    }
}

function getSizes() {
    let sizes = {};

    for(const pixel of world.flat()) {
        if(pixel <= 0) {continue};
        if(sizes[pixel]) {
            sizes[pixel]++;
        } else {
            sizes[pixel] = 1;
        }
    }
    
    for(const country in sizes) {
        if(!sizes[country] || sizes[country] == 0) {
            countries[country].size = "N/A";
        } else {
            countries[country].size = sizes[country];
        }
    }

    worldSize = 0;
    for(const pixel of world.flat()) {
        if(pixel != -1) {
            worldSize++;
        }
    }
}

function run() {
    let thisSpeedID = speedid;
    const expansionLoop = setInterval(() => {
        if(paused) {
            clearInterval(expansionLoop);
            console.log("ended because of pause");
        }
        if(thisSpeedID != speedid) {
            clearInterval(expansionLoop);
            console.log("ended because of speed");
        }
        processCells();
        processRelations();
    }, 200 / speedList[speedid]);
}

const updateLoop = setInterval(() => {
    getSizes();
    refreshStats();
}, 50)

function logg(text) {
    logs.push(text);
    if(logs.length > 4) {
        logs.shift();
    }
    logger.textContent = logs.join(`\n`)
}

function changeName() {
    if(selectedId <= 0) {
        return;
    }

    let prompt = window.prompt("What would you like to change the name of this country to?");

    if(prompt != null && prompt != "") {
        countries[selectedId].name = prompt;
    }
}