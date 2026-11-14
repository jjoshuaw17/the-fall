const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const startScreen = document.getElementById("startScreen");
const winScreen = document.getElementById("winScreen");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const checkpointText = document.getElementById("checkpoint");
const fallsText = document.getElementById("falls");
const resolveText = document.getElementById("resolve");

const W = canvas.width;
const H = canvas.height;

let keys = {};
let running = false;
let won = false;
let falls = 0;
let resolve = 0;
let cameraX = 0;
let cameraY = 0;
let frame = 0;
let checkpoint = 0;

const player = {
  x: 65,
  y: 410,
  w: 28,
  h: 38,
  vx: 0,
  vy: 0,
  grounded: false,
  facing: 1
};

// The platforms form a path up the mountain.
const platforms = [
  { x: 0, y: 475, w: 310, h: 22 },
  { x: 250, y: 390, w: 130, h: 18 },
  { x: 440, y: 320, w: 130, h: 18 },
  { x: 625, y: 245, w: 125, h: 18 },
  { x: 810, y: 320, w: 130, h: 18 },
  { x: 1000, y: 245, w: 130, h: 18 },
  { x: 1190, y: 170, w: 130, h: 18 },
  { x: 1380, y: 245, w: 130, h: 18 },
  { x: 1570, y: 165, w: 130, h: 18 },
  { x: 1760, y: 95, w: 145, h: 18 },
  { x: 1980, y: 165, w: 135, h: 18 },
  { x: 2180, y: 85, w: 150, h: 18 },
  { x: 2420, y: 10, w: 230, h: 22 }
];

const movingPlatforms = [
  { x: 900, y: 405, w: 110, h: 16, start: 900, end: 1080, speed: 1.3, dir: 1 },
  { x: 1650, y: 300, w: 110, h: 16, start: 1650, end: 1820, speed: 1.5, dir: 1 }
];

const checkpoints = [
  { x: 1050, y: 215, name: "CAMP 1", active: false },
  { x: 1810, y: 65, name: "CAMP 2", active: false }
];

const goal = { x: 2510, y: -45, w: 50, h: 55 };

function updateHUD() {
  checkpointText.textContent =
    checkpoint === 0 ? "BASE CAMP" : checkpoints[checkpoint - 1].name;
  fallsText.textContent = falls;
  resolveText.textContent = resolve;
}

function resetPlayer() {
  const base = checkpoint === 0
    ? { x: 65, y: 410 }
    : checkpoint === 1
      ? { x: 1055, y: 180 }
      : { x: 1815, y: 25 };

  player.x = base.x;
  player.y = base.y;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
}

function startGame() {
  falls = 0;
  resolve = 0;
  checkpoint = 0;
  checkpoints.forEach(c => c.active = false);
  movingPlatforms[0].x = movingPlatforms[0].start;
  movingPlatforms[1].x = movingPlatforms[1].start;
  movingPlatforms.forEach(p => p.dir = 1);
  resetPlayer();
  cameraX = 0;
  cameraY = 0;
  won = false;
  running = true;
  startScreen.classList.add("hidden");
  winScreen.classList.add("hidden");
  updateHUD();
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

document.addEventListener("keydown", (e) => {
  keys[e.key.toLowerCase()] = true;

  if ([" ", "arrowup", "arrowleft", "arrowright"].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }

  if (e.key.toLowerCase() === "r" && running) {
    resetPlayer();
  }
});

document.addEventListener("keyup", (e) => {
  keys[e.key.toLowerCase()] = false;
});

function jump() {
  if (player.grounded) {
    player.vy = -(12.5 + Math.min(resolve * 0.12, 3));
    player.grounded = false;
  }
}

function update() {
  if (!running || won) return;

  frame++;

  const left = keys["a"] || keys["arrowleft"];
  const right = keys["d"] || keys["arrowright"];

  if (left) {
    player.vx = -4.2;
    player.facing = -1;
  } else if (right) {
    player.vx = 4.2;
    player.facing = 1;
  } else {
    player.vx *= 0.78;
  }

  if ((keys[" "] || keys["w"] || keys["arrowup"]) && player.grounded) {
    jump();
  }

  player.x += player.vx;
  player.vy += 0.55;
  player.y += player.vy;

  player.x = Math.max(0, Math.min(2700, player.x));

  movingPlatforms.forEach(p => {
    p.x += p.speed * p.dir;
    if (p.x > p.end || p.x < p.start) p.dir *= -1;
  });

  player.grounded = false;

  const allPlatforms = [...platforms, ...movingPlatforms];

  for (const p of allPlatforms) {
    const overlapsX =
      player.x + player.w > p.x &&
      player.x < p.x + p.w;

    const wasAbove = player.y + player.h - player.vy <= p.y;
    const isCrossing = player.y + player.h >= p.y;

    if (overlapsX && wasAbove && isCrossing && player.vy >= 0) {
      player.y = p.y - player.h;
      player.vy = 0;
      player.grounded = true;

      if (movingPlatforms.includes(p)) {
        player.x += p.speed * p.dir;
      }
    }
  }

  // Activate camps as the climber reaches them.
  checkpoints.forEach((c, i) => {
    if (!c.active && player.x > c.x - 35 && player.x < c.x + 100 &&
        Math.abs(player.y + player.h - c.y) < 115) {
      c.active = true;
      checkpoint = i + 1;
      updateHUD();
    }
  });

  // Reach the summit.
  if (
    player.x + player.w > goal.x &&
    player.x < goal.x + goal.w &&
    player.y + player.h > goal.y &&
    player.y < goal.y + goal.h + 30
  ) {
    won = true;
    running = false;
    winScreen.classList.remove("hidden");
  }

  // Falling off the mountain sends the climber to the latest camp.
  if (player.y > 750) {
    falls++;
    resolve++;
    resetPlayer();
    updateHUD();
  }

  // Smooth camera follows the climber.
  const targetX = player.x - W * 0.38;
  const targetY = player.y - H * 0.58;
  cameraX += (targetX - cameraX) * 0.08;
  cameraY += (targetY - cameraY) * 0.08;
  cameraX = Math.max(0, Math.min(1800, cameraX));
  cameraY = Math.min(0, cameraY);
}

function drawSky() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#8bc6d0");
  sky.addColorStop(0.65, "#d7d9c9");
  sky.addColorStop(1, "#f2c99b");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun
  ctx.fillStyle = "#ffe2a5";
  ctx.beginPath();
  ctx.arc(760, 105, 43, 0, Math.PI * 2);
  ctx.fill();

  // Distant mountain silhouettes
  drawMountainLayer("#9bb7b5", 0.12, 330, 100);
  drawMountainLayer("#718f91", 0.22, 390, 130);
  drawMountainLayer("#506e72", 0.34, 450, 155);
}

function drawMountainLayer(color, speed, base, height) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, H);

  for (let x = -100; x <= W + 100; x += 100) {
    const worldX = x + cameraX * speed;
    const peak = base - Math.abs(Math.sin(worldX * 0.004)) * height;
    ctx.lineTo(x, peak);
  }

  ctx.lineTo(W, H);
  ctx.closePath();
  ctx.fill();
}

function drawPlatform(p, moving = false) {
  const x = p.x - cameraX;
  const y = p.y - cameraY;

  if (x + p.w < -20 || x > W + 20 || y > H + 30 || y < -30) return;

  ctx.fillStyle = moving ? "#d99a60" : "#405d60";
  ctx.fillRect(x, y, p.w, p.h);

  ctx.fillStyle = moving ? "#ffd08d" : "#88a69a";
  ctx.fillRect(x, y, p.w, 5);

  ctx.fillStyle = "#243c40";
  for (let i = 12; i < p.w - 8; i += 28) {
    ctx.fillRect(x + i, y + 9, 5, 4);
  }
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y - cameraY;

  ctx.save();
  ctx.translate(x + player.w / 2, y);
  ctx.scale(player.facing, 1);

  // Backpack
  ctx.fillStyle = "#d97848";
  ctx.fillRect(-17, 10, 9, 19);

  // Body
  ctx.fillStyle = "#f2a65a";
  ctx.fillRect(-9, 13, 18, 19);

  // Head
  ctx.fillStyle = "#f3c9a1";
  ctx.beginPath();
  ctx.arc(0, 8, 9, 0, Math.PI * 2);
  ctx.fill();

  // Helmet
  ctx.fillStyle = "#f2a65a";
  ctx.beginPath();
  ctx.arc(0, 5, 10, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(-10, 4, 20, 3);

  // Legs
  ctx.strokeStyle = "#243c40";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-5, 31);
  ctx.lineTo(-8, 37);
  ctx.moveTo(5, 31);
  ctx.lineTo(8, 37);
  ctx.stroke();

  // Face
  ctx.fillStyle = "#243c40";
  ctx.fillRect(3, 8, 2, 2);

  ctx.restore();
}

function drawCheckpoint(c) {
  const x = c.x - cameraX;
  const y = c.y - cameraY;

  if (x < -30 || x > W + 30) return;

  ctx.fillStyle = "#405d60";
  ctx.fillRect(x, y - 40, 4, 40);

  ctx.fillStyle = c.active ? "#f2a65a" : "#e9eee2";
  ctx.beginPath();
  ctx.moveTo(x + 4, y - 40);
  ctx.lineTo(x + 32, y - 31);
  ctx.lineTo(x + 4, y - 22);
  ctx.closePath();
  ctx.fill();
}

function drawGoal() {
  const x = goal.x - cameraX;
  const y = goal.y - cameraY;

  ctx.fillStyle = "#405d60";
  ctx.fillRect(x, y, 5, 55);

  ctx.fillStyle = "#f2a65a";
  ctx.beginPath();
  ctx.moveTo(x + 5, y);
  ctx.lineTo(x + 38, y + 10);
  ctx.lineTo(x + 5, y + 20);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff1ce";
  ctx.font = "bold 13px monospace";
  ctx.fillText("SUMMIT", x - 12, y - 12);
}

function draw() {
  ctx.clearRect(0, 0, W, H);
  drawSky();

  platforms.forEach(p => drawPlatform(p));
  movingPlatforms.forEach(p => drawPlatform(p, true));
  checkpoints.forEach(drawCheckpoint);
  drawGoal();
  drawPlayer();

  // Small climbing hint
  if (running && frame < 240) {
    ctx.fillStyle = "#18343acc";
    ctx.fillRect(18, 18, 215, 34);
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px monospace";
    ctx.fillText("KEEP CLIMBING  ↑", 30, 40);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

updateHUD();
gameLoop();
// Initial screen
drawBackground();
drawWorld();
updateHUD();

