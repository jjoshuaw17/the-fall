
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
let jumpPressed = false;
let running = false;
let won = false;
let falls = 0;
let resolve = 0;
let cameraY = 0;
let frame = 0;
let checkpoint = 0;

const player = {
  x: 90,
  y: 440,
  w: 28,
  h: 38,
  vx: 0,
  vy: 0,
  grounded: false,
  facing: 1
};

// Platforms form a tall parkour tower.
// Smaller gaps make it possible to jump from one to the next.
const platforms = [
  { x: 0, y: 490, w: 300, h: 20 },
  { x: 350, y: 410, w: 125, h: 16 },
  { x: 145, y: 325, w: 120, h: 16 },
  { x: 430, y: 240, w: 120, h: 16 },
  { x: 700, y: 155, w: 125, h: 16 },
  { x: 475, y: 65, w: 120, h: 16 },
  { x: 190, y: -20, w: 125, h: 16 },
  { x: 470, y: -105, w: 120, h: 16 },
  { x: 740, y: -190, w: 125, h: 16 },
  { x: 510, y: -275, w: 120, h: 16 },
  { x: 220, y: -360, w: 125, h: 16 },
  { x: 480, y: -445, w: 120, h: 16 },
  { x: 740, y: -530, w: 130, h: 16 },
  { x: 470, y: -615, w: 125, h: 16 },
  { x: 180, y: -700, w: 130, h: 16 },
  { x: 430, y: -785, w: 140, h: 20 }
];

const movingPlatforms = [
  { x: 560, y: 325, w: 110, h: 15, start: 560, end: 760, speed: 1.5, dir: 1 },
  { x: 100, y: -145, w: 105, h: 15, start: 100, end: 310, speed: 1.8, dir: 1 },
  { x: 650, y: -405, w: 105, h: 15, start: 650, end: 810, speed: 1.4, dir: 1 }
];

const checkpoints = [
  { x: 500, y: 55, name: "CAMP 1", active: false },
  { x: 250, y: -350, name: "CAMP 2", active: false }
];

const goal = { x: 465, y: -875, w: 55, h: 65 };

function updateHUD() {
  checkpointText.textContent =
    checkpoint === 0 ? "BASE CAMP" : checkpoints[checkpoint - 1].name;
  fallsText.textContent = falls;
  resolveText.textContent = resolve;
}

function getSpawn() {
  if (checkpoint === 0) return { x: 90, y: 452 };
  if (checkpoint === 1) return { x: 520, y: 17 };
  return { x: 270, y: -388 };
}

function resetPlayer() {
  const spawn = getSpawn();
  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.grounded = false;
  cameraY = Math.min(0, player.y - 330);
}

function startGame() {
  falls = 0;
  resolve = 0;
  checkpoint = 0;
  checkpoints.forEach(c => c.active = false);

  movingPlatforms.forEach(p => {
    p.x = p.start;
    p.dir = 1;
  });

  resetPlayer();
  won = false;
  running = true;
  frame = 0;

  startScreen.classList.add("hidden");
  winScreen.classList.add("hidden");
  updateHUD();
}

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", startGame);

document.addEventListener("keydown", e => {
  const key = e.key.toLowerCase();

  if ([" ", "arrowup", "arrowleft", "arrowright"].includes(key)) {
    e.preventDefault();
  }

  if (!keys[key] && [" ", "w", "arrowup"].includes(key)) {
    jumpPressed = true;
  }

  keys[key] = true;

  if (key === "r" && running) {
    resetPlayer();
  }
});

document.addEventListener("keyup", e => {
  keys[e.key.toLowerCase()] = false;
});

function update() {
  if (!running || won) return;

  frame++;

  const left = keys["a"] || keys["arrowleft"];
  const right = keys["d"] || keys["arrowright"];

  if (left) {
    player.vx = -4.5;
    player.facing = -1;
  } else if (right) {
    player.vx = 4.5;
    player.facing = 1;
  } else {
    player.vx *= 0.78;
  }

  if (jumpPressed && player.grounded) {
    player.vy = -(13.5 + Math.min(resolve * 0.12, 3));
    player.grounded = false;
  }
  jumpPressed = false;

  player.x += player.vx;
  player.vy += 0.55;
  player.y += player.vy;

  player.x = Math.max(0, Math.min(W - player.w, player.x));

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

  // Checkpoint flags
  checkpoints.forEach((c, i) => {
    if (
      !c.active &&
      player.x + player.w > c.x &&
      player.x < c.x + 65 &&
      Math.abs(player.y + player.h - c.y) < 45
    ) {
      c.active = true;
      checkpoint = i + 1;
      updateHUD();
    }
  });

  // Summit
  if (
    player.x + player.w > goal.x &&
    player.x < goal.x + goal.w &&
    player.y + player.h > goal.y &&
    player.y < goal.y + goal.h
  ) {
    won = true;
    running = false;
    winScreen.classList.remove("hidden");
  }

  // Falling below the screen
  if (player.y - cameraY > H + 100) {
    falls++;
    resolve++;
    resetPlayer();
    updateHUD();
  }

  // Camera moves upward with the player
  const targetCameraY = Math.min(0, player.y - 300);
  cameraY += (targetCameraY - cameraY) * 0.12;
}

function drawSky() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#80b9d1");
  sky.addColorStop(0.55, "#c3d9d1");
  sky.addColorStop(1, "#f5d6ad");

  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun
  ctx.fillStyle = "#ffe8b0";
  ctx.beginPath();
  ctx.arc(790, 90, 42, 0, Math.PI * 2);
  ctx.fill();

  // Floating clouds
  for (let i = 0; i < 7; i++) {
    const x = ((i * 175 + frame * 0.18) % (W + 150)) - 75;
    const y = 75 + (i % 3) * 130;

    ctx.fillStyle = "#ffffff55";
    ctx.beginPath();
    ctx.arc(x, y, 23, 0, Math.PI * 2);
    ctx.arc(x + 25, y - 10, 28, 0, Math.PI * 2);
    ctx.arc(x + 52, y, 22, 0, Math.PI * 2);
    ctx.fill();
  }

  // Distant mountain shapes
  ctx.fillStyle = "#789c9e";
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, 390);
  ctx.lineTo(180, 190);
  ctx.lineTo(350, 390);
  ctx.lineTo(560, 150);
  ctx.lineTo(780, 400);
  ctx.lineTo(960, 210);
  ctx.lineTo(960, H);
  ctx.fill();
}

function drawPlatform(p, moving = false) {
  const x = p.x;
  const y = p.y - cameraY;

  if (y < -40 || y > H + 40) return;

  ctx.fillStyle = moving ? "#d98e53" : "#405e60";
  ctx.fillRect(x, y, p.w, p.h);

  ctx.fillStyle = moving ? "#ffcf91" : "#9cb9a5";
  ctx.fillRect(x, y, p.w, 5);

  ctx.fillStyle = "#263f43";
  for (let i = 15; i < p.w - 10; i += 30) {
    ctx.fillRect(x + i, y + 9, 5, 4);
  }
}

function drawPlayer() {
  const x = player.x;
  const y = player.y - cameraY;

  ctx.save();
  ctx.translate(x + player.w / 2, y);
  ctx.scale(player.facing, 1);

  // Backpack
  ctx.fillStyle = "#d97848";
  ctx.fillRect(-17, 11, 9, 19);

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

  ctx.fillStyle = "#243c40";
  ctx.fillRect(3, 8, 2, 2);

  ctx.restore();
}

function drawCheckpoints() {
  checkpoints.forEach(c => {
    const y = c.y - cameraY;

    if (y < -60 || y > H + 60) return;

    ctx.fillStyle = "#405d60";
    ctx.fillRect(c.x, y - 40, 4, 40);

    ctx.fillStyle = c.active ? "#f2a65a" : "#f1eee0";
    ctx.beginPath();
    ctx.moveTo(c.x + 4, y - 40);
    ctx.lineTo(c.x + 35, y - 30);
    ctx.lineTo(c.x + 4, y - 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#263f43";
    ctx.font = "11px monospace";
    ctx.fillText(c.name, c.x - 8, y - 48);
  });
}

function drawGoal() {
  const x = goal.x;
  const y = goal.y - cameraY;

  ctx.fillStyle = "#405d60";
  ctx.fillRect(x, y, 5, 65);

  ctx.fillStyle = "#f2a65a";
  ctx.beginPath();
  ctx.moveTo(x + 5, y);
  ctx.lineTo(x + 42, y + 12);
  ctx.lineTo(x + 5, y + 24);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#fff1ce";
  ctx.font = "bold 14px monospace";
  ctx.fillText("SUMMIT", x - 13, y - 12);
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  drawSky();

  platforms.forEach(p => drawPlatform(p));
  movingPlatforms.forEach(p => drawPlatform(p, true));

  drawCheckpoints();
  drawGoal();
  drawPlayer();

  // Height indicator
  const height = Math.max(0, Math.floor((490 - player.y) / 10));
  ctx.fillStyle = "#18343acc";
  ctx.fillRect(W - 155, 18, 137, 42);

  ctx.fillStyle = "#ffffff";
  ctx.font = "10px monospace";
  ctx.fillText("HEIGHT", W - 142, 34);
  ctx.font = "bold 16px monospace";
  ctx.fillText(height + " M", W - 142, 51);

  if (running && frame < 240) {
    ctx.fillStyle = "#18343acc";
    ctx.fillRect(18, 18, 215, 34);
    ctx.fillStyle = "#ffffff";
    ctx.font = "12px monospace";
    ctx.fillText("JUMP UP. KEEP GOING!", 30, 40);
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

updateHUD();
gameLoop();

drawWorld();
updateHUD();

