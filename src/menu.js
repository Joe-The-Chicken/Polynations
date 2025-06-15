const menu = document.getElementById("select");
let cur = "main";

class itm {
    constructor(n, t, m) {
        this.name = n;
        this.menu = m;

        this.func = {
            menu : () => addMenu(n,m),
            start : () => addStart(n,m)
        }[t]
    }
}

const mapData = {
    usa : {
        name: "North America",
        dimensions: [260,220],
        data: "na"
    },
    eu : {
        name: "Europe",
        dimensions: [0,0],
        data: []
    },
    w : {
        name: "World",
        dimensions: [1024,765],
        data: "wd"
    },
}

const menus = {
    "main" : [
        new itm("Load Map","menu","maps"),
        new itm("Settings","menu","settings")
    ],
    "maps" : [
        new itm("Back","menu","main"),
        new itm("North America","start","game.html?map=" + btoa(JSON.stringify(mapData.usa))),
        new itm("World","start","game.html?map=" + btoa(JSON.stringify(mapData.w)))
    ],
    "settings" : [
        new itm("Back","menu","main")
    ]
}

function addStart(name, link) {
    let n = document.createElement("a");

    n.textContent = name;
    n.className = `fadein`;

    n.onclick = function() {
        for(const child of menu.children) {
            child.className = "fadeout"
        }
        
        setTimeout(() => {
            window.location.href = link
        }, 1000)
    }

    menu.appendChild(n);
}

function addMenu(name, targetMenu) {
    let n = document.createElement("a");

    n.textContent = name;
    n.className = `fadein`;

    n.onclick = () => update(targetMenu);

    menu.appendChild(n);
}

function update(m) {
    cur = m;

    let timeout = 1000;
    if(menu.children.length == 0) {
        timeout = 0;
    }
    
    for(const child of menu.children) {
        child.className = "fadeout"
    }

    setTimeout(() => {
        menu.innerHTML = "";

        const items = menus[m];
        console.log(items);

        for(const item of items) {
            item.func()
        }
    }, timeout)
}

update("main")