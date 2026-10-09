const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const castBtn = document.getElementById('castBtn');
const resetBtn = document.getElementById('resetBtn');
const statusText = document.getElementById('statusText');
const moneyValue = document.getElementById('moneyValue');
const caughtValue = document.getElementById('caughtValue');
const bestFishValue = document.getElementById('bestFishValue');
const zoneValue = document.getElementById('zoneValue');
const progressBar = document.getElementById('progressBar');
const tensionBar = document.getElementById('tensionBar');
const fishList = document.getElementById('fishList');

const fishSpecies = [
  { name: 'Hammerhead Shark', chance: 0.1, price: 2600, color: '#6d819d', size: 1.8 },
  { name: 'Blue Marlin', chance: 0.5, price: 1700, color: '#6c92d7', size: 1.6 },
  { name: 'Goliath Grouper', chance: 0.3, price: 2100, color: '#8d6c48', size: 1.7 },
  { name: 'Sailfish', chance: 0.8, price: 1500, color: '#7fe2ff', size: 1.5 },
  { name: 'Mahi Mahi', chance: 1.0, price: 650, color: '#f6b44d', size: 1.3 },
  { name: 'Wahoo', chance: 1.5, price: 520, color: '#d7f05a', size: 1.2 },
  { name: 'Permit', chance: 2.0, price: 390, color: '#f1a858', size: 1.1 },
  { name: 'Cobia', chance: 2.5, price: 480, color: '#b3d5b4', size: 1.1 },
  { name: 'Bonefish', chance: 6.0, price: 200, color: '#dddb7a', size: 1.0 },
  { name: 'Tarpon', chance: 9.0, price: 700, color: '#7ac1ff', size: 1.4 },
  { name: 'Red Snapper', chance: 11.0, price: 300, color: '#ff9f6d', size: 1.0 },
  { name: 'Snook', chance: 12.0, price: 360, color: '#d9d0a7', size: 1.0 },
  { name: 'King Mackerel', chance: 8.0, price: 420, color: '#f7d28c', size: 1.15 },
  { name: 'Barracuda', chance: 6.0, price: 260, color: '#98dca8', size: 1.05 },
  { name: 'Grouper', chance: 10.0, price: 340, color: '#bd8a64', size: 1.2 },
  { name: 'Mangrove Snapper', chance: 5.0, price: 240, color: '#d7af7a', size: 0.95 },
  { name: 'Pompano', chance: 7.0, price: 280, color: '#e8bf56', size: 0.9 },
  { name: 'Amberjack', chance: 4.0, price: 260, color: '#77d5d6', size: 0.9 },
  { name: 'Seatrout', chance: 5.0, price: 220, color: '#99c8ff', size: 0.9 },
  { name: 'Ladyfish', chance: 5.0, price: 150, color: '#90bcd5', size: 0.85 },
  { name: 'Flounder', chance: 3.0, price: 180, color: '#d9dfc6', size: 0.8 },
  { name: 'Jack Crevalle', chance: 3.0, price: 200, color: '#8dc0d9', size: 0.85 },
  { name: 'Pinfish', chance: 1.5, price: 70, color: '#82b85d', size: 0.7 },
  { name: 'Silver Trevally', chance: 1.0, price: 100, color: '#b7d3f0', size: 0.8 }
];

const state = {
  mode: 'idle',
  money: 150,
  caught: 0,
  bestFish: null,
  zone: 'Atlantic Coast',
  fish: null,
  progress: 0,
  tension: 50,
  reelHeld: false,
  biteTimer: 0,
  fishX: 0,
  fishY: 0,
  fishDirection: 1,
  boatBob: 0,
  lineLength: 0,
  bobberX: 0,
  bobberY: 0
};

function buildFishTable() {
  const sorted = [...fishSpecies].sort((a, b) => a.chance - b.chance);
  fishList.innerHTML = '';

  sorted.forEach((fish) => {
    const item = document.createElement('li');
    item.className = 'fish-item';
    item.innerHTML = `
      <div>
        <span class="fish-name">${fish.name}</span>
      </div>
      <span class="fish-chance">${fish.chance.toFixed(1)}%</span>
    `;
    fishList.appendChild(item);
  });
}

function updateHud() {
  moneyValue.textContent = `$${state.money}`;
  caughtValue.textContent = String(state.caught);
  bestFishValue.textContent = state.bestFish ? state.bestFish : '-';
  zoneValue.textContent = state.zone;
  progressBar.style.width = `${state.progress}%`;
  tensionBar.style.width = `${Math.max(0, Math.min(100, state.tension))}%`;
}

function randomFish() {
  const totalChance = fishSpecies.reduce((sum, fish) => sum + fish.chance, 0);
  let roll = Math.random() * totalChance;

  for (const fish of fishSpecies) {
    roll -= fish.chance;
    if (roll <= 0) {
      return fish;
    }
  }

  return fishSpecies[fishSpecies.length - 1];
}

function setStatus(message) {
  statusText.textContent = message;
}

function resetTrip() {
  state.mode = 'idle';
  state.fish = null;
  state.progress = 0;
  state.tension = 50;
  state.reelHeld = false;
  state.biteTimer = 0;
  state.fishX = 0;
  state.fishY = 0;
  state.lineLength = 0;
  state.bobberX = canvas.width * 0.56;
  state.bobberY = canvas.height * 0.7;
  setStatus('Find a good spot and cast out into the Gulf.');
  updateHud();
}

function castLine() {
  if (state.mode !== 'idle') {
    return;
  }

  state.mode = 'waiting';
  state.biteTimer = 2.5 + Math.random() * 2.8;
  state.reelHeld = false;
  state.progress = 0;
  state.tension = 50;
  state.lineLength = 0;
  state.bobberX = canvas.width * 0.56;
  state.bobberY = canvas.height * 0.72;
  setStatus('Line cast. Hold tight and wait for the first bite...');
  updateHud();
}

function triggerBite() {
  if (state.mode !== 'waiting') {
    return;
  }

  state.mode = 'biting';
  state.fish = randomFish();
  state.fishX = canvas.width * 0.15;
  state.fishY = canvas.height * 0.45 + Math.random() * 120;
  state.fishDirection = 1;
  setStatus(`You feel a bite! ${state.fish.name} is on the line. Press Space or click to reel.`);
}

function startReeling() {
  if (state.mode !== 'biting') {
    return;
  }

  state.mode = 'reeling';
  state.progress = 10;
  state.tension = 45;
  setStatus(`Reeling in ${state.fish.name}! Keep the line steady.`);
}

function fishCaught() {
  const reward = state.fish.price;
  state.mode = 'idle';
  state.money += reward;
  state.caught += 1;
  state.bestFish = state.bestFish ? (state.fish.price > fishSpecies.find((f) => f.name === state.bestFish)?.price ? state.fish.name : state.bestFish) : state.fish.name;
  const fishName = state.fish.name;
  state.fish = null;
  state.progress = 0;
  state.tension = 50;
  state.reelHeld = false;
  setStatus(`Caught a ${fishName}! You earned $${reward}. Cast again for another trip.`);
  updateHud();
}

function fishEscaped() {
  const fishName = state.fish ? state.fish.name : 'fish';
  state.mode = 'idle';
  state.fish = null;
  state.progress = 0;
  state.tension = 50;
  state.reelHeld = false;
  setStatus(`The ${fishName} snapped free. Try another cast.`);
  updateHud();
}

function update(dt) {
  const boatX = canvas.width * 0.58;
  const boatY = canvas.height * 0.74;

  if (state.mode === 'waiting') {
    state.biteTimer -= dt;
    state.bobberX = boatX + Math.sin(performance.now() * 0.005) * 22;
    state.bobberY = boatY + Math.cos(performance.now() * 0.004) * 6;
    state.lineLength = 120 + Math.sin(performance.now() * 0.012) * 10;

    if (state.biteTimer <= 0) {
      triggerBite();
    }
  }

  if (state.mode === 'biting') {
    state.fishX += state.fishDirection * 14 * dt;
    state.fishY += Math.sin((performance.now() * 0.01) + state.fishX * 0.03) * 0.9;
    if (state.fishX > canvas.width * 0.7 || state.fishX < canvas.width * 0.12) {
      state.fishDirection *= -1;
    }
    state.bobberX = boatX + Math.sin(performance.now() * 0.007) * 18;
    state.bobberY = boatY + Math.cos(performance.now() * 0.005) * 5;
  }

  if (state.mode === 'reeling') {
    if (state.reelHeld) {
      state.progress += 26 * dt;
      state.tension -= 18 * dt;
      if (state.progress > 100) {
        state.progress = 100;
      }
      if (state.tension < 0) {
        state.tension = 0;
      }
    } else {
      state.progress -= 18 * dt;
      state.tension += 21 * dt;
      state.tension = Math.min(100, state.tension);
    }

    const pull = 5 + Math.random() * 12;
    state.tension += (state.reelHeld ? -pull : pull) * dt;
    state.tension = Math.max(0, Math.min(100, state.tension));

    const chaseX = canvas.width * 0.56 + Math.sin(performance.now() * 0.004) * 18;
    const chaseY = canvas.height * 0.42 + Math.cos(performance.now() * 0.006) * 20;
    state.fishX += (chaseX - state.fishX) * 0.06;
    state.fishY += (chaseY - state.fishY) * 0.06;

    if (state.progress >= 100) {
      fishCaught();
      return;
    }

    if (state.tension >= 100) {
      fishEscaped();
      return;
    }
  }

  updateHud();
}

function drawWaterBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, '#79b7e9');
  sky.addColorStop(0.4, '#52a7d2');
  sky.addColorStop(1, '#053552');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fillRect(0, 0, canvas.width, 110);

  ctx.fillStyle = '#0a4266';
  ctx.fillRect(0, 125, canvas.width, canvas.height - 125);

  for (let i = 0; i < 26; i++) {
    const y = 150 + i * 18;
    ctx.strokeStyle = 'rgba(130, 208, 255, 0.28)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= canvas.width; x += 22) {
      const waveY = y + Math.sin(x * 0.045 + i) * 7;
      ctx.lineTo(x, waveY);
    }
    ctx.stroke();
  }
}

function drawBoat() {
  const x = canvas.width * 0.58;
  const y = canvas.height * 0.75;
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#734d2d';
  ctx.fillRect(-38, 0, 76, 16);
  ctx.beginPath();
  ctx.moveTo(-40, 0);
  ctx.lineTo(0, -30);
  ctx.lineTo(40, 0);
  ctx.closePath();
  ctx.fillStyle = '#8a5c34';
  ctx.fill();

  ctx.fillStyle = '#f3d691';
  ctx.fillRect(-8, -18, 16, 18);

  ctx.strokeStyle = '#d7b46d';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, -80);
  ctx.stroke();

  ctx.strokeStyle = '#d1dbe8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -80);
  ctx.lineTo(0, -120 + Math.sin(performance.now() * 0.005) * 8);
  ctx.stroke();

  ctx.restore();
}

function drawBobber() {
  const x = state.bobberX ?? canvas.width * 0.58;
  const y = state.bobberY ?? canvas.height * 0.74;
  ctx.fillStyle = '#fefefe';
  ctx.beginPath();
  ctx.arc(x, y, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff7c7d';
  ctx.fillRect(x - 2, y + 8, 4, 10);
}

function drawFish() {
  if (!state.fish) {
    return;
  }

  const x = state.fishX;
  const y = state.fishY;
  const size = state.fish.size;
  const dir = state.fishDirection;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(dir, 1);

  ctx.fillStyle = state.fish.color;
  ctx.beginPath();
  ctx.ellipse(0, 0, 28 * size, 16 * size, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(28 * size, 0);
  ctx.lineTo(48 * size, -10 * size);
  ctx.lineTo(48 * size, 10 * size);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(10 * size, -3 * size, 3 * size, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#111';
  ctx.beginPath();
  ctx.arc(11 * size, -3 * size, 1.2 * size, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawScene() {
  drawWaterBackground();
  drawBoat();

  if (state.mode === 'waiting' || state.mode === 'biting' || state.mode === 'reeling') {
    drawBobber();
  }

  drawFish();
}

function tick(timestamp) {
  const dt = 1 / 60;
  update(dt);
  drawScene();
  requestAnimationFrame(tick);
}

function handlePointerDown() {
  if (state.mode === 'biting') {
    startReeling();
  }
  state.reelHeld = true;
}

function handlePointerUp() {
  state.reelHeld = false;
}

window.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    if (state.mode === 'biting') {
      startReeling();
    }
    state.reelHeld = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.code === 'Space') {
    state.reelHeld = false;
  }
});

canvas.addEventListener('pointerdown', handlePointerDown);
window.addEventListener('pointerup', handlePointerUp);

castBtn.addEventListener('click', castLine);
resetBtn.addEventListener('click', resetTrip);

buildFishTable();
resetTrip();
requestAnimationFrame(tick);