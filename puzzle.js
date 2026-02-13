/* =========================
   STRUCTURE DU JEU
========================= */
const NIVEAUX_PAR_MONDE = 15;
function mondeActuel() {
  return Math.floor((niveau - 1) / NIVEAUX_PAR_MONDE) + 1;
}
function debutMonde(monde) {
  appliquerDecorMonde(monde);
  alert("🌍 Monde " + monde);
}
function finMonde() {
  alert("🎬 Fin du monde " + mondeActuel());
}
function genererDecorMonde(monde) {
  const teintes = [
    "#b3e5fc", // ciel
    "#c8e6c9", // forêt
    "#ffe0b2", // désert
    "#d1c4e9", // espace
    "#ffccbc", // lave
    "#cfd8dc"  // glace
  ];
  const filtres = [
    "none",
    "saturate(1.2)",
    "sepia(0.4)",
    "contrast(1.2)",
    "hue-rotate(40deg)",
    "brightness(1.2)"
  ];
  return {
    bg: teintes[(monde - 1) % teintes.length],
    filtre: filtres[(monde - 1) % filtres.length]
  };
}
let volumeGlobal = 0.5;
let modeSombre = false;
let musiqueActive = true;

let aideVisible = true;
let modeZen = false; // false = normal | true = zen
let etoilesParNiveau = JSON.parse(localStorage.getItem("etoilesPuzzle")) || {};
let enPause = false;
let confettis = [];
let animationEnCours = false;
let animationStart = 0;
let animationDuration = 150; // ms
let pieceA = null;
let pieceB = null;
const sonVictoire = new Audio("sons/win.mp3");
const sonDefaite = new Audio("sons/lose.mp3");
const sonClic = new Audio("sons/click.mp3");
appliquerVolume();
let classement = JSON.parse(localStorage.getItem("classement")) || [];
let score = 0;
let meilleurScore = Number(localStorage.getItem("meilleurScore")) || 0;
let temps = 60;
let tempsTotal = 60;
let timer = null;
const timeBar = document.getElementById("timeBar");
let niveau = 1;
let taille = 3; // commence en 3x3
let tailleCase;
let modeDefi = true; // true = mode défi | false = mode normal
let gameOver = false;
const photos = ["image/photo1.jpg", "image/photo2.jpg", "image/photo3.jpg", "image/photo4.jpg"];
let indexPhoto = 0;
const canvas = document.getElementById("puzzleCanvas");
const ctx = canvas.getContext("2d");
const img = new Image();
img.src = photos[indexPhoto];
let pieces = [];
let selection = -1;
//  canvas buffer (pour image complète)
const buffer = document.createElement("canvas");
buffer.width = canvas.width;
buffer.height = canvas.height;
const bctx = buffer.getContext("2d");
/* =========================
   IMAGE COMPLÈTE (SANS COUPE)
========================= */
function dessinerImageComplete() {
  const iw = img.width;
  const ih = img.height;
  const cw = canvas.width;
  const ch = canvas.height;
  const scale = Math.min(cw / iw, ch / ih); // IMPORTANT
  const nw = iw * scale;
  const nh = ih * scale;
  const x = (cw - nw) / 2;
  const y = (ch - nh) / 2;
  // dessin dans buffer
  bctx.clearRect(0, 0, cw, ch);
  bctx.drawImage(img, x, y, nw, nh);
}
canvas.style.touchAction = "none";
/* =========================
   INIT PUZZLE
========================= */
img.onload = () => {
  dessinerImageComplete();
  initPuzzle();
  dessiner();
};
function initPuzzle() {
  aideVisible = true;
  tailleCase = canvas.width / taille;
  pieces = [];
  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      pieces.push({ x, y });
    }
  }
  for (let i = 0; i < taille * 20; i++) {
  let a = Math.floor(Math.random() * pieces.length);
  let b = Math.floor(Math.random() * pieces.length);
  [pieces[a], pieces[b]] = [pieces[b], pieces[a]];
}
  //  TIMER (UNE SEULE FOIS)
  clearInterval(timer);
  if (modeZen) {
    timeBar.style.width = "100%";
    timeBar.style.background = "#4caf50";
    return; // 🚫 PAS DE TIMER EN MODE ZEN
  }
  tempsTotal = calculerTemps();
  temps = tempsTotal;
  timeBar.style.width = "100%";
  timeBar.style.background = "green";
  timer = setInterval(() => {
    temps--;
    let pourcentage = (temps / tempsTotal) * 100;
    timeBar.style.width = pourcentage + "%";
    canvas.classList.remove("warning-orange", "warning-red");
    if (pourcentage < 50 && pourcentage >= 25) {
      timeBar.style.background = "orange";
      canvas.classList.add("warning-orange");
    }
    if (pourcentage < 25) {
      timeBar.style.background = "red";
      canvas.classList.add("warning-red");
    }
    timeBar.classList.remove("time-pulse");
    if (pourcentage < 25) {
      timeBar.classList.add("time-pulse");
    }
    const warningText = document.getElementById("warningText");
    if (pourcentage < 25) {
      warningText.style.opacity = "0.7";
    } else {
      warningText.style.opacity = "0";
    }if (pourcentage < 25 && aideVisible) {
  aideVisible =true ; // évite répétition
      animationEnCours = true;
  setTimeout(() => {
    aideVisible =true ;
  animationEnCours = false;
}, 3000); // aide visible 3 secondes
}
    if (temps <= 0 && !modeZen) {
      clearInterval(timer);
      sonDefaite.play();
      if (modeDefi) {
        gameOver = true;
        localStorage.removeItem("puzzleSave");
        alert(" GAME OVER\nScore final : " + score);
        location.reload();
      } else {
        alert(" Temps écoulé !");
        initPuzzle();
        dessiner();
      }
    }
  }, 1000);
  
}
/* =========================
   DESSIN PUZZLE
========================= */
function dessiner() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pieces.forEach((p, i) => {
    const dx = (i % taille) * tailleCase;
    const dy = Math.floor(i / taille) * tailleCase;
    ctx.drawImage(buffer, p.x * tailleCase, p.y * tailleCase, tailleCase, tailleCase, dx, dy, tailleCase, tailleCase);
    ctx.strokeRect(dx, dy, tailleCase, tailleCase);
    // sélection rouge (TON CODE)
    if (i === selection) {
      ctx.strokeStyle = "red";
      ctx.lineWidth = 4;
      ctx.strokeRect(dx + 2, dy + 2, tailleCase - 4, tailleCase - 4);
      ctx.strokeStyle = "black";
      ctx.lineWidth = 1;
    }
  });
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "white";
  pieces.forEach((p, i) => {
    const dx = (i % taille) * tailleCase;
    const dy = Math.floor(i / taille) * tailleCase;
    ctx.fillRect(dx, dy, tailleCase, tailleCase);
  });// MODE ORANGE → indication légère
if (temps / tempsTotal < 0.5 && temps / tempsTotal >= 0.25) {
  afficherSolutionFantome(0.25);
}
// MODE ROUGE → montre comment gagner
if (temps / tempsTotal < 0.25 && aideVisible) {
  afficherSolutionFantome(0.4);
  surlignerErreurs();
}
const ratioTemps = temps / tempsTotal;
  aideSelonMonde(mondeActuel(), ratioTemps);
const monde = mondeActuel();
// AIDE SELON LE MONDE
  
if (ratioTemps < 0.5) {
  if (monde === 1) {
    afficherSolutionFantome(0.4); // très visible
  } 
  else if (monde === 2) {
    afficherSolutionFantome(0.25);
    surlignerErreurs();
  } 
  else if (monde >= 3 && aideVisible) {
    surlignerErreurs(); // seulement erreurs
  }
}
 
  ctx.globalAlpha = 1;
}
function verifierVictoire() {
  for (let i = 0; i < pieces.length; i++) {
    const x = i % taille;
    const y = Math.floor(i / taille);
    if (pieces[i].x !== x || pieces[i].y !== y) {
      return;
    }
  }
  clearInterval(timer);
  sonVictoire.play();
  lancerConfettis();
  ondeVictoire();
  canvas.style.transition = "transform 0.3s, filter 0.3s";
  canvas.style.transform = "scale(1.05)";
  canvas.style.filter = "brightness(1.3)";
  animationEnCours = true;
  setTimeout(() => {
    canvas.style.transform = "scale(1)";
    canvas.style.filter = "brightness(1)";
  animationEnCours = false;
}, 300);
  const points = calculerScore();
  score += points;
  //  MEILLEUR SCORE
  if (score > meilleurScore) {
    meilleurScore = score;
    localStorage.setItem("meilleurScore", meilleurScore);
  }
  // après score += points;
  mettreAJourClassement(score);
  afficherScores();
  let etoiles = 1;
  if (temps > tempsTotal * 0.6) etoiles = 3;
  else if (temps > tempsTotal * 0.3) etoiles = 2;
animationEnCours = true;
  setTimeout(() => {
    alert(
      " Niveau " +
        niveau +
        " réussi !" +
        "\n+ " +
        points +
        " points" +
        "\nScore : " +
        score +
        "\n Meilleur score : " +
        meilleurScore
    );
    const etoiles = calculerEtoiles();
    etoilesParNiveau[niveau] = Math.max(etoilesParNiveau[niveau] || 0, etoiles);
    localStorage.setItem("etoilesPuzzle", JSON.stringify(etoilesParNiveau));
const ancienMonde = mondeActuel();
niveau++;
taille = calculerTaille(niveau);
if (mondeActuel() !== ancienMonde) {
  finMonde();
  debutMonde(mondeActuel());
}
    
    sauvegarderProgression();
    changerPhoto();
  animationEnCours = false;
}, 100);
}
/* =========================
   DÉPLACEMENT (TON CODE)
========================= */
canvas.addEventListener("mousedown", (e) => {
  if (animationEnCours || enPause) return;
  
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const col = Math.floor(mx / tailleCase);
  const row = Math.floor(my / tailleCase);
  if (col < 0 || col >= taille || row < 0 || row >= taille) return;
  const index = row * taille + col;
  if (selection === -1) {
    selection = index;
  } else {
    const firstIndex = selection;
    const secondIndex = index;
    pieceA = { index: firstIndex, piece: pieces[firstIndex] };
    pieceB = { index: secondIndex, piece: pieces[secondIndex] };
    animationStart = performance.now();
    animationEnCours = true;
    selection = -1;
    requestAnimationFrame(animerEchange);
  }
  sonClic.currentTime = 0;
  sonClic.play();
  dessiner();
});
function changerPhoto() {
  // la photo dépend du niveau
  indexPhoto = (niveau - 1) % photos.length;
  img.onload = () => {
    dessinerImageComplete();
    initPuzzle();
    selection = -1;
    dessiner();
    afficherScores();
  };
  img.src = photos[indexPhoto];
}
function calculerTemps() {
  // 60s au niveau 1, -10s par niveau
  let t = 60 - (niveau - 1) * 10;
  if (t < 20) {
    t = 20; // minimum 20 secondes
  }
  return t;
}
function calculerScore() {
  // formule simple et efficace
  return niveau * 100 + temps * 2;
}
function afficherScores() {
  document.getElementById("score").innerText = "Score : " + score;
  document.getElementById("bestScore").innerText = "Meilleur score : " + meilleurScore;
}
afficherScores();
function afficherClassement() {
  const liste = document.getElementById("leaderboard");
  liste.innerHTML = "";
  classement.forEach((s, index) => {
    const li = document.createElement("li");
    li.textContent = `#${index + 1} — ${s} points`;
    liste.appendChild(li);
  });
}
function mettreAJourClassement(scoreFinal) {
  classement.push(scoreFinal);
  // tri décroissant
  classement.sort((a, b) => b - a);
  // garder seulement TOP 5
  classement = classement.slice(0, 5);
  localStorage.setItem("classement", JSON.stringify(classement));
  afficherClassement();
}
afficherScores();
afficherClassement();
function resetMeilleurScore() {
  meilleurScore = 0;
  classement = [];
  localStorage.removeItem("meilleurScore");
  localStorage.removeItem("classement");
  afficherScores();
  afficherClassement();
  alert(" Meilleur score et classement réinitialisés !");
}
document.getElementById("resetBest").addEventListener("click", resetMeilleurScore);
function animerEchange(time) {
  let progress = (time - animationStart) / animationDuration;
  if (progress > 1) progress = 1;
  dessiner();
  const ax = (pieceA.index % taille) * tailleCase;
  const ay = Math.floor(pieceA.index / taille) * tailleCase;
  const bx = (pieceB.index % taille) * tailleCase;
  const by = Math.floor(pieceB.index / taille) * tailleCase;
  const cx = ax + (bx - ax) * progress;
  const cy = ay + (by - ay) * progress;
  const dx = bx + (ax - bx) * progress;
  const dy = by + (ay - by) * progress;
  ctx.drawImage(
    buffer,
    pieceA.piece.x * tailleCase,
    pieceA.piece.y * tailleCase,
    tailleCase,
    tailleCase,
    cx,
    cy,
    tailleCase,
    tailleCase
  );
  ctx.drawImage(
    buffer,
    pieceB.piece.x * tailleCase,
    pieceB.piece.y * tailleCase,
    tailleCase,
    tailleCase,
    dx,
    dy,
    tailleCase,
    tailleCase
  );
  if (progress < 1) {
    requestAnimationFrame(animerEchange);
  } else {
    const temp = pieces[pieceA.index];
    pieces[pieceA.index] = pieces[pieceB.index];
    pieces[pieceB.index] = temp;
    animationEnCours = false;
    dessiner();
    verifierVictoire();
  }
}
function lancerConfettis() {
  confettis = [];
  for (let i = 0; i < 100; i++) {
    confettis.push({
      x: Math.random() * canvas.width,
      y: -20,
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 5 + 2,
      color: `hsl(${Math.random() * 360},100%,50%)`,
      size: Math.random() * 6 + 4
    });
  }
  requestAnimationFrame(animerConfettis);
}
function animerConfettis() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  dessiner();
  confettis.forEach((c) => {
    c.x += c.vx;
    c.y += c.vy;
    c.vy += 0.1;
    ctx.fillStyle = c.color;
    ctx.fillRect(c.x, c.y, c.size, c.size);
  });
  confettis = confettis.filter((c) => c.y < canvas.height);
  if (confettis.length > 0) {
    requestAnimationFrame(animerConfettis);
  }
}
function ondeVictoire() {
  let rayon = 0;
  const max = canvas.width;
  function animer() {
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, rayon, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.4)";
    ctx.lineWidth = 8;
    ctx.stroke();
    rayon += 20;
    if (rayon < max) {
      requestAnimationFrame(animer);
    }
  }
  animer();
}
function sauvegarderProgression() {
  const data = {
    niveau,
    score,
    indexPhoto,
    taille
  };
  localStorage.setItem("puzzleSave", JSON.stringify(data));
}
function chargerProgression() {
  const save = localStorage.getItem("puzzleSave");
  if (save) {
    const data = JSON.parse(save);
    niveau = data.niveau;
    score = data.score;
    indexPhoto = data.indexPhoto;
    taille = data.taille;
    img.src = photos[indexPhoto];
  }
}
document.getElementById("pauseBtn").addEventListener("click", () => {
  if (!enPause) {
    clearInterval(timer);
    enPause = true;
    pauseBtn.innerText = "▶ Reprendre";
  } else {
    enPause = false;
    pauseBtn.innerText = "⏸ Pause";
    if (!modeZen) {
      timer = setInterval(() => {
        temps--;
        let pourcentage = (temps / tempsTotal) * 100;
        timeBar.style.width = pourcentage + "%";
        if (temps <= 0) {
          clearInterval(timer);
          sonDefaite.play();
          alert("Temps écoulé !");
          initPuzzle();
          dessiner();
        }
      }, 1000);
    }
  }
});
function calculerEtoiles() {
  if (temps > tempsTotal * 0.6) return 3;
  if (temps > tempsTotal * 0.3) return 2;
  return 1;
}
function resetEtoiles() {
  etoilesParNiveau = {};
  localStorage.removeItem("etoilesPuzzle");
  alert("🌟 Étoiles réinitialisées !");
}
function afficherEtoiles() {
  let texte = "⭐ ÉTOILES OBTENUES ⭐\n\n";
  for (const niv in etoilesParNiveau) {
    texte += `Niveau ${niv} : ${"⭐".repeat(etoilesParNiveau[niv])}\n`;
  }
  if (Object.keys(etoilesParNiveau).length === 0) {
    texte += "Aucune étoile pour le moment 😢";
  }
  alert(texte);
}
document.getElementById("zenBtn").addEventListener("click", () => {
  modeZen = !modeZen;
  if (modeZen) {
    clearInterval(timer);
    document.getElementById("zenBtn").innerText = "⏱ Mode Défi";
    timeBar.style.width = "100%";
    timeBar.style.background = "#4caf50";
    alert("🧘 Mode Zen activé\nAucun chrono, joue tranquillement");
  } else {
    document.getElementById("zenBtn").innerText = "🧘 Mode Zen";
    initPuzzle(); // relance le timer
  }
});
function afficherSolutionFantome(opacity = 0.25) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.drawImage(buffer, 0, 0, canvas.width, canvas.height);
  ctx.restore();
}
function surlignerErreurs() {
  pieces.forEach((p, i) => {
    const x = i % taille;
    const y = Math.floor(i / taille);
    if (p.x !== x || p.y !== y) {
      const dx = x * tailleCase;
      const dy = y * tailleCase;
      ctx.save();
      ctx.strokeStyle = "rgba(255,0,0,0.8)";
      ctx.lineWidth = 4;
      ctx.strokeRect(dx + 4, dy + 4, tailleCase - 8, tailleCase - 8);
      ctx.restore();
    }
  });
}
document.getElementById("voirEtoiles").addEventListener("click", afficherEtoiles);
document.getElementById("resetEtoiles").addEventListener("click", resetEtoiles);
document.getElementById("btnAccueil").addEventListener("click", () => {
  // optionnel : sauvegarde avant de partir
  sauvegarderProgression();
  window.location.href = "index.html";
});
canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (animationEnCours || enPause) return;
  const t = e.touches[0];
  const rect = canvas.getBoundingClientRect();
  const col = Math.floor((t.clientX - rect.left) / tailleCase);
  const row = Math.floor((t.clientY - rect.top) / tailleCase);
  const index = row * taille + col;
  if (selection === -1) selection = index;
  else if (selection !== index) {
    pieceA = { index: selection, piece: pieces[selection] };
    pieceB = { index, piece: pieces[index] };
    animationStart = performance.now();
    animationEnCours = true;
    selection = -1;
    requestAnimationFrame(animerEchange);
  }
});
function niveauDansMonde() {
  return ((niveau - 1) % NIVEAUX_PAR_MONDE) + 1;
}
function estFinDeMonde() {
  return niveauDansMonde() === NIVEAUX_PAR_MONDE;
}
function afficherMenuMondes() {
  const menu = document.getElementById("menuMondes");
  menu.innerHTML = "<h2>🌍 Choix du monde</h2>";
  const mondeMax = mondeActuel(); // monde débloqué
  for (let m = 1; m <= mondeMax; m++) {
    const btn = document.createElement("button");
    btn.textContent = "Monde " + m;
    btn.onclick = () => afficherMenuNiveaux(m);
    menu.appendChild(btn);
  }
}
function afficherMenuNiveaux(monde) {
  const menu = document.getElementById("menuMondes");
  menu.innerHTML = `<h2>🌍 Monde ${monde}</h2>`;
  const debut = (monde - 1) * NIVEAUX_PAR_MONDE + 1;
  const fin = monde * NIVEAUX_PAR_MONDE;
  for (let n = debut; n <= fin; n++) {
    const btn = document.createElement("button");
    const etoiles = etoilesParNiveau[n] || 0;
    btn.innerHTML = `Niv ${n} ${"⭐".repeat(etoiles)}`;
    if (n > niveau) {
      btn.disabled = true; // 🔒 pas débloqué
    } else {
      btn.onclick = () => lancerNiveau(n);
    }
    menu.appendChild(btn);
  }
  const retour = document.createElement("button");
  retour.textContent = "⬅ Retour mondes";
  retour.onclick = afficherMenuMondes;
  menu.appendChild(retour);
}
function lancerNiveau(n) {
  niveau = n;
  taille = 3 + (n - 1); // ou ta logique
  changerPhoto();
  appliquerDecorMonde(mondeActuel());
}
function indiquerBonnePiece() {
  pieces.forEach((p, i) => {
    const x = i % taille;
    const y = Math.floor(i / taille);
    if (p.x !== x || p.y !== y) {
      const dx = x * tailleCase;
      const dy = y * tailleCase;
      ctx.save();
      ctx.strokeStyle = "rgba(0,255,0,0.8)";
      ctx.lineWidth = 5;
      ctx.strokeRect(dx + 6, dy + 6, tailleCase - 12, tailleCase - 12);
      ctx.restore();
      return; // UNE seule pièce indiquée
    }
  });
}
function appliquerDecorMonde(monde) {
  const decor = genererDecorMonde(monde);
  document.body.style.background = decor.bg;
  canvas.style.filter = decor.filtre;
}
 
function aideSelonMonde(monde, ratioTemps) {
  if (modeZen) return;
  if (monde <= 2 && ratioTemps < 0.6) {
    afficherSolutionFantome(0.4);
  } 
  else if (monde <= 4 && ratioTemps < 0.4) {
    afficherSolutionFantome(0.25);
    surlignerErreurs();
  } 
  else if (monde >= 5 && ratioTemps < 0.3) {
    indiquerBonnePiece(); // UNE seule aide
  }
}
function calculerTaille(niveau) {
  return Math.min(3 + Math.floor((niveau - 1) / 2), 12);
}
document.getElementById("btnInfo").addEventListener("click", () => {
  
  
  alert(
    "🧩 Puzzle Mondes & Niveaux\n\n" +
    "Niveau actuel : " + niveau + "\n" +
    "Monde actuel : " + mondeActuel() + "\n" +
    "Taille grille : " + taille + "x" + taille + "\n" +
    "Mode Zen : " + (modeZen ? "Oui" : "Non") + "\n" +
    "Score : " + score
  );
}
                                                   );

function appliquerVolume() {
  const v = musiqueActive ? volumeGlobal : 0;
  sonVictoire.volume = v;
  sonDefaite.volume = v;
  sonClic.volume = v;
}

function resetProgression() {
  if (confirm("⚠ Supprimer toute la progression ?")) {
    localStorage.removeItem("puzzleSave");
    localStorage.removeItem("etoilesPuzzle");
    localStorage.removeItem("classement");
    localStorage.removeItem("meilleurScore");
    location.reload();
  }
}
const modal = document.getElementById("modalOptions");
const volumeSlider = document.getElementById("volumeSlider");

volumeSlider.value = volumeGlobal;

document.getElementById("btnOptions").addEventListener("click", () => {
   
  modal.style.display = "flex";
 
});

document.getElementById("fermerOptions").addEventListener("click", () => {
  modal.style.display = "none";
});

volumeSlider.addEventListener("input", (e) => {
  volumeGlobal = parseFloat(e.target.value);
  appliquerVolume();
});
document.getElementById("btnMODE").addEventListener("click", () => {

  const choix = prompt(
    "⚙ OPTIONS\n\n" +
    "1️⃣ Mode sombre\n" +
    "2️⃣ Activer / Désactiver son\n" +
    "3️⃣ Reset progression\n\n" +
    "Tape 1, 2 ou 3"
  );

  if (choix === "1") {
    modeSombre = !modeSombre;
    document.body.classList.toggle("dark-mode");
  }

  if (choix === "2") {
    musiqueActive = !musiqueActive;
    appliquerVolume();
    alert(musiqueActive ? "🔊 Son activé" : "🔇 Son désactivé");
  }

  if (choix === "3") {
    resetProgression();
  }
});

