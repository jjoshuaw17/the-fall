
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");

const fallsDisplay = document.getElementById("falls");
const resolveDisplay = document.getElementById("resolve");
const checkpointDisplay = document.getElementById("checkpoint");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let running = false;
let won = false;
let cameraX = 0;
let cameraY = 0;

const keys = {};

const player = {
    x: 60,
    y: 420,
    width: 28,
    height: 42,
    vx: 0,
    vy: 0,
    speed: 4,
    jumpPower: 12,
    grounded: false
};

const gravity = 0.55;
const worldHeight = 1100;

let falls = 0;
let resolve = 0;

let checkpoint = {
    x: 60,
    y: 420,
    name: "Base Camp"
};

// Mountain platforms
const platforms = [
    {x: 0, y: 470, w: 350, h: 70},
    {x: 390, y: 405, w: 160, h: 25},
    {x: 610, y: 340, w: 150, h: 25},
    {x: 820, y: 270, w: 170, h: 25},
    {x: 1050, y: 340, w: 160, h: 25},
    {x: 1280, y: 270, w: 170, h: 25},
    {x: 1510, y: 200, w: 170, h: 25},
    {x: 1740, y: 270, w: 160, h: 25},
    {x: 1960, y: 190, w: 180, h: 25},
    {x: 2200, y: 120, w: 240, h: 25}
];

const checkpoints = [
    {x: 820, y: 270, name: "Forest Camp"},
    {x: 1510, y: 200, name: "Cliff Camp"}
];

const goal = {
    x: 2300,
    y: 55,
    width: 45,
    height: 65
};

// Keyboard controls
document.addEventListener("keydown", (e) => {
    keys[e.key.toLowerCase()] = true;

    if (
        [" ", "arrowup", "arrowdown",
         "arrowleft", "arrowright"].includes(e.key.toLowerCase())
    ) {
        e.preventDefault();
    }
});

document.addEventListener("keyup", (e) => {
    keys[e.key.toLowerCase()] = false;
});

document.getElementById("startButton").onclick = startGame;
document.getElementById("restartButton").onclick = () => {
    resetGame();
    startGame();
};

function startGame() {
    startScreen.classList.add("hidden");
    winScreen.classList.add("hidden");
    running = true;
    won = false;
    requestAnimationFrame(gameLoop);
}

function resetGame() {
    player.x = 60;
    player.y = 420;
    player.vx = 0;
    player.vy = 0;

    falls = 0;
    resolve = 0;
    cameraX = 0;
    cameraY = 0;

    checkpoint = {
        x: 60,
        y: 420,
        name: "Base Camp"
    };

    updateHUD();
}

function updateHUD() {
    fallsDisplay.textContent = "Falls: " + falls;
    resolveDisplay.textContent = "Resolve: " + resolve;
    checkpointDisplay.textContent =
        "Checkpoint: " + checkpoint.name;
}

function respawn() {
    falls++;

    // Every fall makes the next jump a little stronger.
    resolve = Math.min(resolve + 1, 5);

    player.x = checkpoint.x;
    player.y = checkpoint.y;
    player.vx = 0;
    player.vy = 0;

    updateHUD();
}

function update() {
    if (!running || won) return;

    // Horizontal movement
    player.vx = 0;

    if (keys["a"] || keys["arrowleft"]) {
        player.vx = -player.speed;
    }

    if (keys["d"] || keys["arrowright"]) {
        player.vx = player.speed;
    }

    // Jump
    if (
        (keys[" "] || keys["w"] || keys["arrowup"]) &&
        player.grounded
    ) {
        player.vy = -(player.jumpPower + resolve * 0.6);
        player.grounded = false;
    }

    // Gravity
    player.vy += gravity;
    player.vy = Math.min(player.vy, 15);

    // Horizontal collision
    player.x += player.vx;
    player.x = Math.max(0, Math.min(player.x, 2440 - player.width));

    // Vertical movement
    player.y += player.vy;
    player.grounded = false;

    // Platform collision
    for (const platform of platforms) {
        const horizontal =
            player.x + player.width > platform.x &&
            player.x < platform.x + platform.w;

        const crossedTop =
            player.y + player.height >= platform.y &&
            player.y + player.height - player.vy <= platform.y;

        if (horizontal && crossedTop && player.vy >= 0) {
            player.y = platform.y - player.height;
            player.vy = 0;
            player.grounded = true;
        }
    }

    // Activate checkpoints
    for (const cp of checkpoints) {
        if (
            player.x + player.width > cp.x &&
            player.x < cp.x + 45 &&
            Math.abs(
                player.y + player.height - cp.y
            ) < 8
        ) {
            checkpoint = {
                x: cp.x,
                y: cp.y - player.height,
                name: cp.name
            };

            updateHUD();
        }
    }

    // Fall detection
    if (player.y > worldHeight) {
        respawn();
    }

    // Goal detection
    if (
        player.x + player.width > goal.x &&
        player.x < goal.x + goal.width &&
        player.y + player.height > goal.y &&
        player.y < goal.y + goal.height
    ) {
        won = true;
        running = false;
        winScreen.classList.remove("hidden");
    }

    // Follow player
    cameraX = Math.max(
        0,
        Math.min(player.x - WIDTH / 2, 2440 - WIDTH)
    );

    cameraY = Math.max(
        0,
        Math.min(player.y - HEIGHT / 2, worldHeight - HEIGHT)
    );
}

function drawBackground() {
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#6d9ec4");
    sky.addColorStop(1, "#d8c6a0");

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Distant mountains
    ctx.fillStyle = "#7794a6";
    for (let i = 0; i < 8; i++) {
        let x = i * 350 - cameraX * 0.25;
        ctx.beginPath();
        ctx.moveTo(x - 100, HEIGHT);
        ctx.lineTo(x + 100, 100 + (i % 3) * 45);
        ctx.lineTo(x + 300, HEIGHT);
        ctx.fill();
    }

    // Clouds
    ctx.fillStyle = "rgba(255,255,255,0.65)";
    for (let i = 0; i < 6; i++) {
        let x = (i * 240 - cameraX * 0.1) % 1100;
        if (x < -100) x += 1100;

        ctx.beginPath();
        ctx.arc(x, 90 + (i % 3) * 45, 24, 0, Math.PI * 2);
        ctx.arc(x + 25, 90 + (i % 3) * 45, 32, 0, Math.PI * 2);
        ctx.arc(x + 55, 90 + (i % 3) * 45, 22, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawWorld() {
    // Platforms
    for (const platform of platforms) {
        const x = platform.x - cameraX;
        const y = platform.y - cameraY;

        ctx.fillStyle = "#536c55";
        ctx.fillRect(x, y, platform.w, platform.h);

        ctx.fillStyle = "#8caa76";
        ctx.fillRect(x, y, platform.w, 7);

        ctx.fillStyle = "#344a43";
        ctx.fillRect(x, y + 7, platform.w, platform.h - 7);
    }

    // Checkpoints
    for (const cp of checkpoints) {
        const x = cp.x - cameraX;
        const y = cp.y - cameraY;

        ctx.fillStyle = "#493b30";
        ctx.fillRect(x, y - 40, 5, 40);

        ctx.fillStyle = "#f4c875";
        ctx.fillRect(x + 5, y - 40, 28, 17);
    }

    // Summit flag
    ctx.fillStyle = "#493b30";
    ctx.fillRect(
        goal.x - cameraX,
        goal.y - cameraY,
        5,
        65
    );

    ctx.fillStyle = "#e5a94f";
    ctx.fillRect(
        goal.x - cameraX + 5,
        goal.y - cameraY,
        35,
        20
    );

    // Player
    const px = player.x - cameraX;
    const py = player.y - cameraY;

    // Body
    ctx.fillStyle = "#243d59";
    ctx.fillRect(px, py + 12, player.width, 30);

    // Head
    ctx.fillStyle = "#f1c7a1";
    ctx.fillRect(px + 4, py, 20, 18);

    // Backpack
    ctx.fillStyle = "#d58b42";
    ctx.fillRect(px - 5, py + 16, 9, 17);

    // Legs
    ctx.fillStyle = "#172b42";
    ctx.fillRect(px + 3, py + 35, 9, 7);
    ctx.fillRect(px + 17, py + 35, 9, 7);
}

function gameLoop() {
    if (!running) return;

    update();

    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    drawBackground();
    drawWorld();

    requestAnimationFrame(gameLoop);
}

// Initial screen
drawBackground();
drawWorld();
updateHUD();

