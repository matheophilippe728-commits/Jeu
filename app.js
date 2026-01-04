// CIVITAS — app.js (V1 solide)
// Objectif : navigation fiable + pas de reprise auto + base PWA propre.

const BUILD = "v1.0.0";

const $ = (id) => document.getElementById(id);

const screens = {
  home: $("screen-home"),
  wizard: $("screen-wizard"),
  game: $("screen-game"),
};

function show(name){
  Object.values(screens).forEach(s => s.classList.remove("active"));
  screens[name].classList.add("active");
}

function esc(s){
  return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function labelEpoch(v){
  return ({
    prehistoire:"Préhistoire", antiquite:"Antiquité", medieval:"Médiéval",
    industriel:"Industriel", moderne:"Moderne", futur:"Futur"
  })[v] || v;
}
function labelWorld(v){
  return ({
    continent:"Terre alternative", archipel:"Archipel", supercontinent:"Supercontinent",
    deuxcontinents:"Deux continents", fracture:"Monde fracturé"
  })[v] || v;
}

// -------- Save system (Archives)
const SAVE_KEY = "civitas_save_v1";

function saveGame(state){
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}
function loadGame(){
  const raw = localStorage.getItem(SAVE_KEY);
  if(!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// -------- Simple generators
function rnd(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
function genName(){
  const a=["Axe","Oru","Kara","Sile","Noma","Ula","Tera","Dene","Vara","Kora"];
  const b=["lla","th","na","dor","m","ra","lia","sen","kar","vel"];
  return rnd(a) + rnd(b);
}
function genFactions(n=6){
  const base=["Khar","Ulren","Sava","Tyr","Oshen","Nemor","Doru","Mara","Kesa","Uru","Zeran","Eld"];
  const suf=["a","en","ir","os","um","ka","eth","al","un"];
  const out=[];
  for(let i=0;i<n;i++){
    out.push({ id:"F"+i, name: rnd(base)+rnd(suf) });
  }
  return out;
}

// -------- Game state
let game = null;

// -------- UI render
function renderHUD(){
  const p = game.player.stats;
  $("hudTitle").innerHTML = `${esc(game.player.name)} — Tour ${game.turn} — ${labelEpoch(game.epoch)}`;
  $("hudMeta").innerHTML = `${labelWorld(game.world)} • Difficulté : IMPITOYABLE • Seed ${game.seed}`;

  $("hudPills").innerHTML = `
    <div class="pill">👥 <b>${p.population}</b></div>
    <div class="pill">🌾 <b>${p.food}</b></div>
    <div class="pill">🧱 <b>${p.materials}</b></div>
    <div class="pill">🕊️ <b>${p.influence}</b></div>
    <div class="pill">⚖️ <b>${p.cohesion}</b></div>
  `;
}

function renderGame(){
  renderHUD();
  // placeholder canvas
  const canvas = $("mapCanvas");
  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.clearRect(0,0,rect.width,rect.height);

  ctx.fillStyle = "rgba(0,0,0,0.10)";
  ctx.font = "18px Georgia";
  ctx.fillText("Carte hex : étape suivante (pan/zoom + sélection + panneau contextuel).", 18, 40);

  $("log").innerHTML = `
    <b>Fondation</b> : ${esc(game.player.capital)}<br>
    Factions générées : ${game.factions.map(f=>esc(f.name)).join(", ")}<br><br>
    Prochaine étape : carte hex complète + interactions (clic sur faction/hex).
  `;
}

function newGameFromWizard(){
  const epoch = $("epoch").value;
  const world = $("world").value;
  const name = $("civName").value.trim() || "Civilisation sans nom";

  game = {
    version: BUILD,
    seed: Math.floor(Math.random()*999999),
    turn: 1,
    epoch,
    world,
    difficulty: "impitoyable",
    player: {
      name,
      capital: genName(),
      stats: { population:120, food:90, materials:70, influence:50, cohesion:60 }
    },
    factions: genFactions(6)
  };

  saveGame(game);
  show("game");
  renderGame();
}

// -------- Wire buttons (fix clics)
function wire(){
  $("buildTag").textContent = `build ${BUILD}`;

  $("btn-new").addEventListener("click", () => show("wizard"));
  $("btn-back").addEventListener("click", () => show("home"));

  $("btn-start").addEventListener("click", newGameFromWizard);

  $("btn-archives").addEventListener("click", () => {
    const g = loadGame();
    if(!g){
      alert("Aucune archive pour l’instant.");
      return;
    }
    game = g;
    show("game");
    renderGame();
  });

  // actions (placeholder)
  document.querySelectorAll(".action").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      alert("Étape 3 : moteur de tours + actions longues (2–5 tours) + risques/échecs.");
    });
  });

  // musique (iOS interdit autoplay → on démarre au clic)
  let audio = null;
  $("btn-audio").addEventListener("click", async ()=>{
    if(!audio){
      audio = new Audio("music.mp3"); // optionnel plus tard
      audio.loop = true;
      audio.volume = 0.5;
    }
    try{
      if(audio.paused){ await audio.play(); $("btn-audio").textContent = "Couper musique"; }
      else { audio.pause(); $("btn-audio").textContent = "Activer musique"; }
    }catch(e){
      alert("Audio bloqué (normal sur iOS si pas d’action utilisateur). On verra plus tard.");
    }
  });
}

// -------- Service Worker register
function registerSW(){
  if(!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("sw.js").catch(()=>{});
}

// Boot
document.addEventListener("DOMContentLoaded", ()=>{
  wire();
  registerSW();

  // IMPORTANT : on NE recharge PAS une partie automatiquement.
  // On reste toujours sur l'accueil (comme tu l’as demandé).
  show("home");
});
