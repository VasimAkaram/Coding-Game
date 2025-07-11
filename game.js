// Code Knight - Typing Battle Game
// Main game logic

// --- Game Data ---
const SNIPPETS = [
  // Beginner JS
  { code: 'for(let i=0; i<5; i++) { console.log(i); }', tip: 'This is a for loop.' },
  { code: 'let x = 10;', tip: 'Variable declaration.' },
  { code: 'if(x > 5) { alert("Hi!"); }', tip: 'Simple if statement.' },
  { code: 'function greet(name) { return "Hello, " + name; }', tip: 'Function definition.' },
  // Beginner HTML
  { code: '<h1>Hello World</h1>', tip: 'HTML heading.' },
  { code: '<button>Click me</button>', tip: 'HTML button.' },
  // Beginner CSS
  { code: 'body { background: #222; }', tip: 'CSS body background.' },
  { code: 'color: #00ffe7;', tip: 'CSS color property.' },
  // Intermediate
  { code: 'const arr = [1,2,3].map(x => x*2);', tip: 'Array map method.' },
  { code: 'document.querySelector("#id")', tip: 'DOM selector.' },
  { code: 'ul > li.selected', tip: 'CSS selector.' },
  // Advanced
  { code: 'try { risky(); } catch(e) { console.error(e); }', tip: 'Try-catch block.' },
  { code: 'class Knight { constructor(name) { this.name = name; } }', tip: 'ES6 class.' },
  { code: 'input[type="text"]:focus { outline: none; }', tip: 'CSS pseudo-class.' },
];

const ENEMIES = [
  { name: 'Slime', avatar: '🟢', maxHealth: 30 },
  { name: 'Goblin', avatar: '👺', maxHealth: 40 },
  { name: 'Skeleton', avatar: '💀', maxHealth: 50 },
  { name: 'Orc', avatar: '👹', maxHealth: 60 },
  { name: 'Sorcerer', avatar: '🧙', maxHealth: 70 },
  { name: 'Dragon', avatar: '🐉', maxHealth: 100 },
];

// --- State ---
let gameState = {
  mode: 'battle', // 'battle' or 'practice'
  level: 1,
  score: 0,
  highScore: 0,
  combo: 0,
  maxCombo: 0,
  playerHealth: 100,
  enemyHealth: 0,
  enemyMaxHealth: 0,
  currentSnippet: null,
  currentChar: 0,
  freeze: false,
  timer: null,
  timeLimit: 20, // Default, but will be set per-snippet
  mistake: false,
};

// --- DOM Elements ---
const startScreen = document.getElementById('start-screen');
const gameScreen = document.getElementById('game-screen');
const endScreen = document.getElementById('end-screen');
const startBtn = document.getElementById('start-btn');
const practiceBtn = document.getElementById('practice-btn');
const restartBtn = document.getElementById('restart-btn');
const backBtn = document.getElementById('back-btn');
const highScoreDiv = document.getElementById('high-score');
const playerHealthBar = document.getElementById('player-health');
const enemyHealthBar = document.getElementById('enemy-health');
const enemyName = document.getElementById('enemy-name');
const enemyAvatar = document.getElementById('enemy-avatar');
const codeSnippet = document.getElementById('code-snippet');
const codeTooltip = document.getElementById('code-tooltip');
const typedProgress = document.getElementById('typed-progress');
const progressInner = document.getElementById('progress-inner');
const comboStreak = document.getElementById('combo-streak');
const levelSpan = document.getElementById('level');
const scoreSpan = document.getElementById('score');
const finalScore = document.getElementById('final-score');
const endTitle = document.getElementById('end-title');
const swordSound = document.getElementById('sword-sound');
const gruntSound = document.getElementById('grunt-sound');

// --- Utility Functions ---
function getRandomSnippet(level) {
  // More complex snippets for higher levels
  if (level < 3) return SNIPPETS[Math.floor(Math.random() * 6)];
  if (level < 5) return SNIPPETS[Math.floor(Math.random() * 10)];
  return SNIPPETS[Math.floor(Math.random() * SNIPPETS.length)];
}
function getEnemy(level) {
  return ENEMIES[Math.min(level-1, ENEMIES.length-1)];
}
function updateHighScore(newScore) {
  if (newScore > gameState.highScore) {
    gameState.highScore = newScore;
    localStorage.setItem('codeKnightHighScore', newScore);
  }
}
function loadHighScore() {
  const hs = localStorage.getItem('codeKnightHighScore');
  gameState.highScore = hs ? parseInt(hs) : 0;
  highScoreDiv.textContent = `High Score: ${gameState.highScore}`;
}
function playSound(sound) {
  if (!sound) return;
  sound.currentTime = 0;
  sound.play();
}

// --- Animation & Particle Effects ---
function pulseHealthBar(bar) {
  bar.classList.remove('pulse');
  void bar.offsetWidth; // trigger reflow
  bar.classList.add('pulse');
}
function animateEnemyAttack() {
  enemyAvatar.classList.remove('attack');
  void enemyAvatar.offsetWidth;
  enemyAvatar.classList.add('attack');
}
function createParticles(type, x, y) {
  // type: 'slash' (green), 'spark' (red)
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = x + 'px';
  container.style.top = y + 'px';
  container.style.pointerEvents = 'none';
  container.style.zIndex = 100;
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.style.position = 'absolute';
    p.style.width = '6px';
    p.style.height = '2px';
    p.style.borderRadius = '2px';
    p.style.background = type === 'slash' ? 'linear-gradient(90deg,#00ff99,#00ffe7)' : 'linear-gradient(90deg,#ff4d4d,#ffe066)';
    p.style.opacity = '0.8';
    const angle = Math.random() * 2 * Math.PI;
    const dist = 24 + Math.random() * 16;
    p.style.transform = `rotate(${angle}rad)`;
    p.style.transition = 'all 0.7s cubic-bezier(.68,-0.55,.27,1.55)';
    setTimeout(() => {
      p.style.left = Math.cos(angle) * dist + 'px';
      p.style.top = Math.sin(angle) * dist + 'px';
      p.style.opacity = '0';
    }, 10);
    container.appendChild(p);
  }
  document.body.appendChild(container);
  setTimeout(() => container.remove(), 800);
}
function getCodeAreaCenter() {
  const rect = codeSnippet.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2
  };
}

// --- UI Functions ---
function showScreen(screen) {
  startScreen.classList.add('hidden');
  gameScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  screen.classList.remove('hidden');
}
function updateHUD() {
  playerHealthBar.style.width = gameState.playerHealth + '%';
  enemyHealthBar.style.width = (gameState.enemyHealth / gameState.enemyMaxHealth * 100) + '%';
  levelSpan.textContent = gameState.level;
  scoreSpan.textContent = gameState.score;
  comboStreak.textContent = gameState.combo >= 10 ? `Combo! x${gameState.combo}` : '';
}
function showSnippet() {
  const { code } = gameState.currentSnippet;
  let html = '';
  for (let i = 0; i < code.length; i++) {
    if (i < gameState.currentChar) {
      html += `<span class="typed-char">${escapeHTML(code[i])}</span>`;
    } else if (i === gameState.currentChar && gameState.mistake) {
      html += `<span class="wrong-char">${escapeHTML(code[i])}</span>`;
    } else {
      html += `<span>${escapeHTML(code[i])}</span>`;
    }
  }
  codeSnippet.innerHTML = html;
  codeTooltip.textContent = gameState.currentSnippet.tip;
  progressInner.style.width = (gameState.currentChar / code.length * 100) + '%';
}
function escapeHTML(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function showEnemy(enemy) {
  enemyName.textContent = enemy.name;
  enemyAvatar.textContent = enemy.avatar;
}

// --- Game Logic ---
function startGame(mode = 'battle') {
  gameState = {
    ...gameState,
    mode,
    level: 1,
    score: 0,
    combo: 0,
    maxCombo: 0,
    playerHealth: 100,
    currentChar: 0,
    freeze: false,
    mistake: false,
  };
  showScreen(gameScreen);
  nextBattle();
  updateHUD();
}
function nextBattle() {
  // Pick enemy and snippet
  const enemy = getEnemy(gameState.level);
  showEnemy(enemy);
  gameState.enemyHealth = enemy.maxHealth;
  gameState.enemyMaxHealth = enemy.maxHealth;
  gameState.currentSnippet = getRandomSnippet(gameState.level);
  gameState.currentChar = 0;
  gameState.mistake = false;
  // Set time limit: at least 2 seconds per character, max 40 seconds
  const codeLen = gameState.currentSnippet.code.length;
  gameState.timeLimit = Math.min(40, codeLen * 2);
  showSnippet();
  updateHUD();
  startTimer();
}
function startTimer() {
  clearTimeout(gameState.timer);
  if (gameState.mode === 'practice') return;
  gameState.timer = setTimeout(() => {
    enemyAttack();
  }, gameState.timeLimit * 1000);
}
function enemyAttack() {
  gameState.playerHealth -= 20;
  if (gameState.playerHealth <= 0) {
    pulseHealthBar(playerHealthBar);
    animateEnemyAttack();
    createParticles('spark', ...Object.values(getCodeAreaCenter()));
    endGame(false);
    return;
  }
  updateHUD();
  pulseHealthBar(playerHealthBar);
  animateEnemyAttack();
  createParticles('spark', ...Object.values(getCodeAreaCenter()));
  playSound(gruntSound);
  // Reset snippet
  gameState.combo = 0;
  nextBattle();
}
function playerAttack() {
  gameState.enemyHealth -= 1;
  gameState.score += 1;
  gameState.combo += 1;
  gameState.maxCombo = Math.max(gameState.combo, gameState.maxCombo);
  playSound(swordSound);
  pulseHealthBar(enemyHealthBar);
  createParticles('slash', ...Object.values(getCodeAreaCenter()));
  if (gameState.combo % 10 === 0) {
    comboStreak.textContent = `Combo! x${gameState.combo}`;
  }
  if (gameState.enemyHealth <= 0) {
    // Enemy defeated
    gameState.level += 1;
    nextBattle();
  }
  updateHUD();
}
function handleKey(e) {
  if (gameState.freeze || !gameScreen || gameScreen.classList.contains('hidden')) return;
  const code = gameState.currentSnippet.code;
  if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
    if (e.key === code[gameState.currentChar]) {
      gameState.currentChar++;
      gameState.mistake = false;
      playerAttack();
      if (gameState.currentChar >= code.length) {
        setTimeout(() => {
          gameState.level += 1;
          nextBattle();
        }, 500);
        return;
      }
    } else {
      // Mistake
      gameState.mistake = true;
      gameState.combo = 0;
      showSnippet();
      playSound(gruntSound);
      gameState.freeze = true;
      pulseHealthBar(playerHealthBar);
      animateEnemyAttack();
      createParticles('spark', ...Object.values(getCodeAreaCenter()));
      setTimeout(() => {
        gameState.freeze = false;
        gameState.mistake = false;
        showSnippet();
      }, 1000);
      return;
    }
    showSnippet();
  }
}
function endGame(victory) {
  showScreen(endScreen);
  finalScore.textContent = `Score: ${gameState.score}`;
  endTitle.textContent = victory ? 'Victory!' : 'Game Over';
  updateHighScore(gameState.score);
  loadHighScore();
}

// --- Event Listeners ---
startBtn.onclick = () => startGame('battle');
practiceBtn.onclick = () => startGame('practice');
restartBtn.onclick = () => startGame(gameState.mode);
backBtn.onclick = () => showScreen(startScreen);
document.addEventListener('keydown', handleKey);

// --- Init ---
function init() {
  loadHighScore();
  showScreen(startScreen);
}
init(); 