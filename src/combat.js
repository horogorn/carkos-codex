// ============================================================================
// THE CARKOS CODEX — Turn-Based Combat Controller & Physical ASCII d20 Engine
// Imports from ./lore.js, ./state.js, and the typography leaf.
// ============================================================================

import { ENEMY_TEMPLATES, PANTHEON } from "./lore.js";
import { canvasFont } from "./typography.js";
import {
  state,
  fallingDice,
  addItem,
  getComputedStats,
  grantXP,
  spawnFloatText,
  saveGame
} from "./state.js";

// Cross-module callbacks registered once by src/main.js at boot
const hooks = {
  setDialogue: () => {},
  updateHUD: () => {},
  updateNavButtons: () => {},
  playSFX: () => {}
};

export function configureCombat(callbacks) {
  Object.assign(hooks, callbacks);
}

// ============================================================================
// 1. Physical Falling ASCII d20 Dice Engine
// ============================================================================

export function launchPhysicalDice(finalRoll, mod, label, onLandCallback) {
  state.diceRolling = true;
  fallingDice.length = 0;
  fallingDice.push({
    x: 0.46 + (Math.random() - 0.5) * 0.08,
    y: 0.08,
    vx: (Math.random() - 0.5) * 0.012,
    vy: 0.004,
    angle: Math.random() * Math.PI * 2,
    vAngle: (Math.random() > 0.5 ? 1 : -1) * 0.22,
    bounces: 0,
    settled: false,
    settleTimer: 0,
    finalRoll,
    mod,
    label,
    onLand: onLandCallback
  });
}

export function updateAndDrawPhysicalDice(ctx, canvasWidth = ctx.canvas.width, canvasHeight = ctx.canvas.height) {
  for (let i = fallingDice.length - 1; i >= 0; i--) {
    const d = fallingDice[i];
    if (!d.settled) {
      d.vy += 0.0017;
      d.x += d.vx;
      d.y += d.vy;
      d.angle += d.vAngle;

      if (d.x < 0.18 || d.x > 0.82) {
        d.vx *= -0.75;
        d.x = Math.max(0.18, Math.min(0.82, d.x));
      }
      if (d.y >= 0.78) {
        d.y = 0.78;
        d.vy *= -0.52;
        d.vx *= 0.75;
        d.vAngle *= 0.65;
        d.bounces++;
        if (d.bounces >= 3 && Math.abs(d.vy) < 0.006) {
          d.settled = true;
          d.angle = 0;
          state.diceRolling = false;
          if (d.onLand) d.onLand();
        }
      }
    } else {
      d.settleTimer++;
      if (d.settleTimer > 130) {
        fallingDice.splice(i, 1);
        continue;
      }
    }

    const px = d.x * canvasWidth;
    const py = d.y * canvasHeight;
    const radius = 32;

    ctx.save();
    ctx.translate(px, py);
    ctx.fillStyle = "rgba(6, 5, 5, 0.92)";
    ctx.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = d.angle + (k * Math.PI) / 3;
      if (k === 0) ctx.moveTo(Math.cos(a) * radius, Math.sin(a) * radius);
      else ctx.lineTo(Math.cos(a) * radius, Math.sin(a) * radius);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = d.settled ? PANTHEON[state.godKey].hex : "#e8e0d2";
    ctx.lineWidth = 2;
    ctx.stroke();

    const displayNum = d.settled ? d.finalRoll : Math.floor(Math.random() * 20) + 1;
    ctx.font = canvasFont(16);
    ctx.fillStyle = d.settled ? "#ffffff" : "#cfc7ba";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(displayNum, 0, 1);

    if (d.settled) {
      const sign = d.mod >= 0 ? `+${d.mod}` : `${d.mod}`;
      const badge = `${d.label}: d20(${d.finalRoll})${sign} = ${d.finalRoll + d.mod}`;
      ctx.font = canvasFont(11);
      const tw = ctx.measureText(badge).width;
      ctx.fillStyle = "rgba(5, 4, 4, 0.95)";
      ctx.fillRect(-tw / 2 - 5, -radius - 22, tw + 10, 16);
      ctx.fillStyle = PANTHEON[state.godKey].hex;
      ctx.fillText(badge, 0, -radius - 14);
    }
    ctx.restore();
  }
}

// ============================================================================
// 2. Encounter HUD Helpers
// ============================================================================

export function hideEncounterHUD() {
  const hud = document.getElementById("enemy-hud");
  if (hud) hud.classList.add("hidden");
}

export function updateEncounterHUD() {
  const enc = state.encounter;
  if (!enc) return;

  const hud = document.getElementById("enemy-hud");
  if (hud) hud.classList.remove("hidden");

  const nameEl = document.getElementById("enemy-name");
  const stateEl = document.getElementById("enemy-state");
  const hpFillEl = document.getElementById("enemy-hp-fill");
  const teleEl = document.getElementById("enemy-telegraph");

  if (nameEl) nameEl.textContent = enc.name;
  if (stateEl) stateEl.textContent = enc.stateLabel;
  if (hpFillEl) hpFillEl.style.width = `${Math.max(0, (enc.hp / enc.maxHp) * 100)}%`;
  if (teleEl) {
    teleEl.textContent = `Telegraph: ${enc.telegraphs[enc.turnIdx % enc.telegraphs.length]}`;
  }
}

// ============================================================================
// 3. Encounter Lifecycle (Start, Player Choices, Enemy Turn, Victory)
// ============================================================================

export function startEncounter(enemyKey, isBoss = false) {
  const tmpl = ENEMY_TEMPLATES[enemyKey];
  if (!tmpl) return;

  state.screen = "encounter";
  state.viewArtId = null;
  state.hoveredHotspot = null;
  state.shield = state.camp.totem >= 2 ? (state.camp.totem - 1) * 2 : 0;
  state.combatPulse = 0.85;
  hooks.updateNavButtons();

  const depthScale = state.dungeon ? 1 + (state.dungeon.depth - 1) * 0.25 : 1.0;
  const hpMult = (isBoss ? 1.45 : 1.0) * depthScale;

  state.encounter = {
    ...tmpl,
    isBoss,
    maxHp: Math.floor(tmpl.maxHp * hpMult),
    hp: Math.floor(tmpl.maxHp * hpMult),
    stateLabel: isBoss ? "VAULT GUARDIAN" : "HOSTILE",
    turnIdx: 0,
    bleedTurns: 0,
    stunned: false
  };

  updateEncounterHUD();
  renderEncounterChoices(
    `Out of the deep shadows emerges <strong>${state.encounter.name}</strong>! Sweep your torchlight across the arena to inspect its towering form.`
  );
}

export function renderEncounterChoices(html) {
  const enc = state.encounter;
  if (!enc) return;

  const god = PANTHEON[state.godKey];
  const darkPenalty = state.torchTurns === 0 ? " [-3 DARK]" : "";
  const guardAmount = 3 + state.camp.totem;

  hooks.setDialogue("3D Confrontation // Cast Bone-Dice", enc.name, html, [
    { label: `Strike (+${state.weaponTier} Blade) [STR vs DC 11${darkPenalty}]`, action: "enc-strike" },
    { label: `Invoke ${god.skill} [FTH vs DC 12${darkPenalty}]`, action: "enc-miracle" },
    { label: `Speak / Parley [${enc.parleyStat.toUpperCase()} vs DC ${enc.parleyDC}]`, action: "enc-parley" },
    { label: `Brace & Guard (+${guardAmount} Shield)`, action: "enc-guard" }
  ]);
}

function resolveEnemyTurn(log) {
  const enc = state.encounter;
  if (!enc) return;

  if (enc.bleedTurns > 0) {
    enc.hp = Math.max(0, enc.hp - 2);
    enc.bleedTurns--;
    log += ` <em>(Sanguine bleed deals 2 DMG!)</em>`;
  }

  if (enc.hp <= 0) {
    endEncounterVictory(`${log}<br><br><strong>${enc.name} collapses back into the abyss!</strong>`);
    return;
  }

  if (enc.stunned) {
    enc.stunned = false;
    enc.turnIdx++;
    updateEncounterHUD();
    renderEncounterChoices(`${log}<br><br><em>${enc.name} recoils in the torchlight, losing its turn!</em>`);
    return;
  }

  const raw = enc.atk + (enc.isBoss ? 1 : 0);
  const blocked = Math.min(raw, state.shield);
  const dmg = Math.max(0, raw - blocked);
  state.shield = 0;

  if (dmg > 0) {
    state.hp = Math.max(1, state.hp - dmg);
    hooks.playSFX(85, 0.25);
    spawnFloatText(0.28, 0.62, `-${dmg} HP`, "#ff4d45");
    if (enc.artId === "mirevisage" && enc.turnIdx % 2 === 0) state.curses.add("drift");
    if (enc.artId === "marionette" && enc.turnIdx % 2 === 1) state.curses.add("dread");
  } else {
    spawnFloatText(0.28, 0.62, "WARDED!", "#7da882");
  }

  enc.turnIdx++;
  hooks.updateHUD();
  updateEncounterHUD();
  renderEncounterChoices(
    `${log}<br><br>${enc.name} strikes for <strong>${dmg} DMG</strong>${blocked > 0 ? ` (${blocked} blocked)` : ""}!`
  );
}

function endEncounterVictory(summary) {
  const enc = state.encounter;
  if (!enc) return;

  const gainedSP = enc.sp + (enc.isBoss ? 18 : 0);
  const gainedXP = enc.xp + (enc.isBoss ? 40 : 0);
  state.sp += gainedSP;
  grantXP(gainedXP);

  if (enc.isBoss || Math.random() < 0.65) {
    addItem(enc.loot, 1);
    summary += `<br>Recovered relic: <strong>${enc.loot} (x1)</strong>!`;
  }
  summary += `<br>Gained <strong>+${gainedSP} SP</strong> and <strong>+${gainedXP} XP</strong>.`;

  if (state.dungeon) {
    state.dungeon.rooms[state.dungeon.currentRoomId].cleared = true;
  }

  state.encounter = null;
  hideEncounterHUD();
  hooks.updateHUD();
  saveGame();

  hooks.setDialogue("Victory // Spoils Claimed", "Silence Returns", summary, [
    { label: "Continue Exploration →", action: state.dungeon ? "dng-resume" : "open-map" }
  ]);
}

// ============================================================================
// 4. Combat Action Dispatcher (Returns true if handled)
// ============================================================================

export function handleCombatAction(action) {
  if (!state.encounter) return false;

  const stats = getComputedStats();
  const darkMod = state.torchTurns === 0 ? -3 : 0;

  if (action === "enc-strike") {
    const d20 = Math.floor(Math.random() * 20) + 1;
    launchPhysicalDice(d20, stats.str + darkMod, "Strike", () => {
      const total = d20 + stats.str + darkMod;
      if (total >= 11) {
        const dmg = (d20 === 20 ? 8 : 5) + state.weaponTier;
        state.encounter.hp = Math.max(0, state.encounter.hp - dmg);
        state.combatPulse = 0.85;
        spawnFloatText(0.62, 0.42, `-${dmg} HIT!`, "#ffffff");
        resolveEnemyTurn(
          `<strong>Strike (${total} vs DC 11):</strong> Your +${state.weaponTier} blade deals <strong>${dmg} DMG</strong>!`
        );
      } else {
        spawnFloatText(0.62, 0.42, "MISS", "#8f877b");
        resolveEnemyTurn(
          `<strong>Strike (${total} vs DC 11):</strong> Your strike glances off ancient bone.`
        );
      }
    });
    return true;
  }

  if (action === "enc-miracle") {
    const god = PANTHEON[state.godKey];
    const d20 = Math.floor(Math.random() * 20) + 1;
    launchPhysicalDice(d20, stats.fth + darkMod, god.skill, () => {
      const total = d20 + stats.fth + darkMod;
      state.brandLevel = Math.min(10, state.brandLevel + 1);
      if (total >= 12) {
        state.combatPulse = 1.0;
        let log = `<strong>${god.skill} (${total} vs DC 12):</strong> `;
        if (god.effect === "bleed") {
          state.encounter.hp = Math.max(0, state.encounter.hp - 4);
          state.encounter.bleedTurns = 2;
          log += "Sanguine Talon deals 4 DMG + Bleed!";
        } else if (god.effect === "stun") {
          state.encounter.hp = Math.max(0, state.encounter.hp - 3);
          state.encounter.stunned = true;
          log += "Blinding truth deals 3 DMG + Stun!";
        } else if (god.effect === "heal") {
          state.hp = Math.min(state.maxHp, state.hp + 5);
          state.encounter.hp = Math.max(0, state.encounter.hp - 2);
          log += "Pyre-chant heals +5 HP and deals 2 DMG!";
        } else {
          state.shield += 5;
          state.encounter.hp = Math.max(0, state.encounter.hp - 3);
          log += "Spectral ward grants +5 Shield and deals 3 DMG!";
        }
        resolveEnemyTurn(log);
      } else {
        resolveEnemyTurn(`<strong>${god.skill} (${total} vs DC 12):</strong> Your Patron remains silent.`);
      }
    });
    return true;
  }

  if (action === "enc-parley") {
    const enc = state.encounter;
    const mod = stats[enc.parleyStat] + darkMod;
    const d20 = Math.floor(Math.random() * 20) + 1;
    launchPhysicalDice(d20, mod, "Parley", () => {
      const total = d20 + mod;
      if (total >= enc.parleyDC) {
        enc.stateLabel = "PACIFIED";
        updateEncounterHUD();
        endEncounterVictory(
          `<strong>Parley (${total} vs DC ${enc.parleyDC}):</strong> Your words pierce the creature's hollow fog. It sinks back into the dark.`
        );
      } else {
        resolveEnemyTurn(
          `<strong>Parley (${total} vs DC ${enc.parleyDC}):</strong> Only a hollow rattle answers your plea.`
        );
      }
    });
    return true;
  }

  if (action === "enc-guard") {
    const guardGain = 3 + state.camp.totem;
    state.shield += guardGain;
    resolveEnemyTurn(`<strong>Guard:</strong> You brace behind your guard (+${guardGain} Shield).`);
    return true;
  }

  return false;
}