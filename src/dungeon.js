// ============================================================================
// THE CARKOS CODEX — Procedural Multi-Level Dungeons, Minimap & Room Events
// Imports ONLY from ./state.js to keep a strict one-way dependency graph.
// ============================================================================

import {
  state,
  addItem,
  removeItem,
  getItemQty,
  advanceTime,
  getComputedStats,
  grantXP,
  spawnFloatText,
  saveGame
} from "./state.js";

// Cross-module callbacks registered once by src/main.js at boot
const hooks = {
  setDialogue: () => {},
  updateHUD: () => {},
  updateTimeHUD: () => {},
  updateNavButtons: () => {},
  launchPhysicalDice: () => {},
  startEncounter: () => {},
  openWorldMap: () => {}
};

export function configureDungeon(callbacks) {
  Object.assign(hooks, callbacks);
}

// ============================================================================
// 1. Procedural Multi-Level Generator (Secret Rooms, Puzzles & Floor Bosses)
// ============================================================================

export function generateDungeon(dungeonId, depth = 1) {
  const isTier2 = dungeonId === "velkhar";
  const baseName = isTier2 ? "Old Velkhar Ruins" : "The Sunken Ossuary";

  const rooms = [];
  const occupied = new Map();
  const dirs = [
    { dx: 0, dy: -1 },
    { dx: 1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 }
  ];

  function addRoom(gx, gy, type, label, isSecret = false) {
    const id = rooms.length;
    const room = {
      id,
      gx,
      gy,
      type,
      label,
      isSecret,
      connections: [],
      visited: id === 0,
      revealed: id === 0,
      cleared: id === 0
    };
    rooms.push(room);
    occupied.set(`${gx},${gy}`, id);
    return room;
  }

  addRoom(
    2,
    2,
    "entrance",
    depth === 1 ? "Ascending Surface Stairs" : `Stairs from Depth ${depth - 1}`
  );

  const roomPool = ["combat", "painting", "treasure", "puzzle", "wandering", "trap", "well"];
  const roomNames = {
    combat: isTier2 ? "Pit-Beast Nest" : "Bone-Cluttered Nave",
    painting: "Gallery of the Thousand Eyes",
    treasure: "Iron-Bound Reliquary",
    puzzle: "Chamber of the Silent Keeper",
    wandering: "Collapsed Pilgrim Alcove",
    trap: "Spiked Flagstone Corridor",
    well: "Room with a Whispering Well"
  };

  while (rooms.length < 8) {
    const parent = rooms[Math.floor(Math.random() * rooms.length)];
    const d = dirs[Math.floor(Math.random() * dirs.length)];
    const nx = parent.gx + d.dx;
    const ny = parent.gy + d.dy;
    if (nx < 0 || nx > 4 || ny < 0 || ny > 4) continue;
    const key = `${nx},${ny}`;
    if (!occupied.has(key)) {
      const rType = roomPool[(rooms.length - 1) % roomPool.length];
      const child = addRoom(nx, ny, rType, roomNames[rType]);
      parent.connections.push(child.id);
      child.connections.push(parent.id);
    }
  }

  // Attach hidden Secret Vault adjacent to the Wall Painting room
  const paintRoom = rooms.find((r) => r.type === "painting");
  if (paintRoom) {
    for (const d of dirs) {
      const sx = paintRoom.gx + d.dx;
      const sy = paintRoom.gy + d.dy;
      if (sx >= 0 && sx <= 4 && sy >= 0 && sy <= 4 && !occupied.has(`${sx},${sy}`)) {
        const secret = addRoom(sx, sy, "treasure", "Hidden Reliquary Vault", true);
        paintRoom.connections.push(secret.id);
        secret.connections.push(paintRoom.id);
        break;
      }
    }
  }

  // Attach Floor Boss Sanctum to the furthest non-secret room with an open edge
  const nonSecret = rooms.filter((r) => !r.isSecret);
  for (let i = nonSecret.length - 1; i >= 0; i--) {
    const anchor = nonSecret[i];
    let placed = false;
    for (const d of dirs) {
      const bx = anchor.gx + d.dx;
      const by = anchor.gy + d.dy;
      if (bx >= 0 && bx <= 4 && by >= 0 && by <= 4 && !occupied.has(`${bx},${by}`)) {
        const bossRoom = addRoom(
          bx,
          by,
          "boss",
          isTier2 ? "Green Sun Throne" : "Ossuary Sepulcher"
        );
        anchor.connections.push(bossRoom.id);
        bossRoom.connections.push(anchor.id);
        placed = true;
        break;
      }
    }
    if (placed) break;
  }

  // Reveal non-secret neighbors of entrance
  rooms[0].connections.forEach((cid) => {
    if (!rooms[cid].isSecret) rooms[cid].revealed = true;
  });

  state.dungeon = {
    id: dungeonId,
    baseName,
    depth,
    tier: isTier2 ? 2 : 1,
    rooms,
    currentRoomId: 0
  };
  state.screen = "dungeon";
  state.viewArtId = null;

  hooks.updateNavButtons();
  renderDungeonRoom();
  saveGame();
}

// ============================================================================
// 2. Room Navigation, Torch Burn & 3D Shader Parameter Mapping
// ============================================================================

export function moveToDungeonRoom(roomId) {
  const dng = state.dungeon;
  if (!dng || !dng.rooms[roomId]) return;

  const room = dng.rooms[roomId];
  dng.currentRoomId = roomId;
  room.visited = true;
  room.revealed = true;
  room.connections.forEach((cid) => {
    if (!dng.rooms[cid].isSecret) dng.rooms[cid].revealed = true;
  });

  state.stepCounter++;
  if (state.stepCounter % 4 === 0) {
    advanceTime(1);
    hooks.updateTimeHUD();
  }

  // Burn 1 torch turn per room step; auto-light spare Pitch Torch if available
  if (state.torchTurns > 0) {
    state.torchTurns--;
    if (state.torchTurns === 0 && getItemQty("Pitch Torch") > 0) {
      removeItem("Pitch Torch", 1);
      state.torchTurns = 8;
      spawnFloatText(0.5, 0.3, "FRESH TORCH LIT", "#ffcf70");
    }
  }

  hooks.updateHUD();
  renderDungeonRoom();
  saveGame();
}

export function getDungeonRenderParams() {
  const dng = state.dungeon;
  if (!dng) return { envCode: 1.0, propType: 0.0, propState: 0.0 };

  const room = dng.rooms[dng.currentRoomId];
  if (room.type === "well") {
    return { envCode: 2.0, propType: 0.0, propState: room.cleared ? 1.0 : 0.0 };
  }

  const pMap = {
    entrance: 0.0,
    treasure: 1.0,
    painting: 2.0,
    trap: 3.0,
    puzzle: 4.0,
    combat: 8.0,
    wandering: 8.0,
    boss: room.cleared ? 6.0 : 8.0
  };

  let pState = room.cleared ? 1.0 : 0.0;
  if (room.type === "painting") {
    const sec = room.connections.map((cid) => dng.rooms[cid]).find((r) => r.isSecret);
    pState = sec && sec.revealed ? 1.0 : 0.0;
  }
  if (room.type === "boss" && room.cleared) {
    pState = 0.0; // Display descending spiral staircase
  }

  return {
    envCode: 1.0,
    propType: pMap[room.type] ?? 0.0,
    propState: pState
  };
}

export function revealSecretInCurrentRoom() {
  if (!state.dungeon) return false;
  const cur = state.dungeon.rooms[state.dungeon.currentRoomId];
  const sec = cur.connections
    .map((cid) => state.dungeon.rooms[cid])
    .find((r) => r.isSecret && !r.revealed);

  if (sec) {
    sec.revealed = true;
    saveGame();
    return true;
  }
  return false;
}

// ============================================================================
// 3. Room Narrative & Choices Renderer
// ============================================================================

export function renderDungeonRoom() {
  const dng = state.dungeon;
  if (!dng) return;

  const room = dng.rooms[dng.currentRoomId];
  const darkWarning =
    state.torchTurns === 0
      ? " <strong style='color:#ff554d;'>[PITCH DARKNESS: -3 TO ROLLS!]</strong>"
      : "";
  const tagPrefix = `${dng.baseName} • DEPTH ${dng.depth}`;

  const navChoices = room.connections
    .filter((cid) => dng.rooms[cid].revealed)
    .map((cid) => {
      const target = dng.rooms[cid];
      const label = target.visited ? target.label : "Unexplored Doorway (?)";
      return {
        label: `Enter → ${label}`,
        action: `dng-move-${cid}`,
        isSecret: target.isSecret
      };
    });

  if (room.type === "entrance") {
    const exitChoice =
      dng.depth === 1
        ? { label: "Ascend Entrance Stairs → World Map", action: "exit-dungeon-surface" }
        : { label: `Ascend Stairs → Depth ${dng.depth - 1}`, action: "dng-ascend-level" };
    hooks.setDialogue(
      `${tagPrefix} // Entrance`,
      room.label,
      `Cold subterranean air blows past the carved stone steps. <em>Only from this stairwell may you escape the depths.</em>${darkWarning}`,
      [...navChoices, exitChoice]
    );
  } else if (room.type === "combat" && !room.cleared) {
    hooks.setDialogue(
      `${tagPrefix} // Ambush`,
      room.label,
      `A towering silhouette blocks the vaulted colonnade!${darkWarning}`,
      [{ label: "Confront the Horror!", action: "dng-fight" }]
    );
  } else if (room.type === "boss" && !room.cleared) {
    hooks.setDialogue(
      `${tagPrefix} // Vault Sanctum`,
      room.label,
      `The colossal guardian of Depth ${dng.depth} stands before a descending spiral stairwell.${darkWarning}`,
      [{ label: "Challenge the Floor Boss!", action: "dng-boss" }]
    );
  } else if (room.type === "boss" && room.cleared) {
    hooks.setDialogue(
      `${tagPrefix} // Stairwell Unlocked`,
      room.label,
      `With the guardian fallen, a dark spiral staircase opens downward into <strong>Depth ${dng.depth + 1}</strong>.${darkWarning}`,
      [{ label: `▼ Descend Stairs into Depth ${dng.depth + 1}`, action: "dng-descend-level" }, ...navChoices]
    );
  } else if (room.type === "treasure" && !room.cleared) {
    hooks.setDialogue(
      `${tagPrefix} // ${room.isSecret ? "SECRET VAULT" : "Relic Cache"}`,
      room.label,
      `An iron-bound chest rests beneath the arches. Click it in the 3D viewport or disarm its lock.${darkWarning}`,
      [{ label: "Disarm & Open Chest [INT Check DC 12]", action: "dng-chest" }, ...navChoices]
    );
  } else if (room.type === "painting") {
    const secretDoor = room.connections.map((cid) => dng.rooms[cid]).find((r) => r.isSecret);
    const alreadyOpen = Boolean(secretDoor && secretDoor.revealed);
    hooks.setDialogue(
      `${tagPrefix} // Mural Chamber`,
      room.label,
      alreadyOpen
        ? `The heavy mural stands tilted askew, revealing a dark passage into a <strong>Secret Vault</strong>!${darkWarning}`
        : `A massive stone-framed painting of a thousand weeping eyes hangs on the back wall. A faint draft slips behind its frame.${darkWarning}`,
      [
        ...(!alreadyOpen
          ? [{ label: "Inspect & Shift the Wall Mural [INT Check DC 11]", action: "dng-painting" }]
          : []),
        ...navChoices
      ]
    );
  } else if (room.type === "puzzle" && !room.cleared) {
    hooks.setDialogue(
      `${tagPrefix} // The Silent Keeper`,
      room.label,
      `A skeletal pedestal holds two coins: a <strong>Silver Coin (Left)</strong> and a <strong>Mud Coin (Right)</strong>. Inscription: <em>"Those of frail Will offer Silver; those of iron Will offer Mud."</em>${darkWarning}`,
      [
        { label: "Place Silver Coin in Left Hand (For WIL < 7)", action: "dng-puzzle-silver" },
        { label: "Place Mud Coin in Right Hand (For WIL ≥ 7)", action: "dng-puzzle-mud" },
        ...navChoices
      ]
    );
  } else if (room.type === "trap" && !room.cleared) {
    hooks.setDialogue(
      `${tagPrefix} // Trapped Corridor`,
      room.label,
      `Gleaming iron spikes protrude from a recessed floor grate across the hall.${darkWarning}`,
      [{ label: "Jam & Disarm Spike Grate [INT Check DC 12]", action: "dng-trap" }, ...navChoices]
    );
  } else if (room.type === "wandering" && !room.cleared) {
    hooks.setDialogue(
      `${tagPrefix} // Lost Pilgrim`,
      room.label,
      `Huddled beside a broken pillar sits a shivering knight in ornate green frog-helm armor.${darkWarning}`,
      [{ label: "Speak with the Exiled Frog-Knight", action: "dng-wandering-talk" }, ...navChoices]
    );
  } else if (room.type === "well" && !room.cleared) {
    hooks.setDialogue(
      `${tagPrefix} // Whispering Well`,
      room.label,
      `A circular stone well sits beneath curved bone-ribs, its black water rippling softly.${darkWarning}`,
      [
        { label: "Peer into Your Reflection [WIL Check DC 12]", action: "dng-well" },
        { label: "Toss 2 Silver Pieces into the Well", action: "dng-well-coin" },
        ...navChoices
      ]
    );
  } else {
    hooks.setDialogue(
      `${tagPrefix} // Cleared Hall`,
      room.label,
      `Only dust and your own flickering torchlight remain in this chamber.${darkWarning}`,
      [...navChoices, { label: "Make Camp in this Chamber", action: "open-camp" }]
    );
  }
}

// ============================================================================
// 4. Isometric Minimap HUD & Clickable Dungeon Hotspots
// ============================================================================

export function drawDungeonMinimapHUD(ctx, canvasWidth) {
  if (state.screen !== "dungeon" || !state.dungeon || state.viewArtId) return;

  const dng = state.dungeon;
  const boxW = 168;
  const boxH = 116;
  const bx = canvasWidth - boxW - 12;
  const by = 12;

  ctx.fillStyle = "rgba(6, 5, 5, 0.90)";
  ctx.fillRect(bx, by, boxW, boxH);
  ctx.strokeStyle = "#4a4138";
  ctx.lineWidth = 1.4;
  ctx.strokeRect(bx, by, boxW, boxH);

  ctx.font = 'bold 9.5px "Courier New", Courier, monospace';
  ctx.fillStyle = "#b59b6d";
  ctx.textBaseline = "top";
  ctx.fillText(`DEPTH ${dng.depth} CHART`, bx + 8, by + 12);

  const cx = bx + boxW * 0.5;
  const cy = by + 34;
  const tw = 16;
  const th = 8.5;
  const iso = (gx, gy) => ({ x: cx + (gx - gy) * tw, y: cy + (gx + gy) * th });

  ctx.strokeStyle = "#6e655c";
  ctx.lineWidth = 1.5;
  dng.rooms.forEach((r) => {
    if (!r.revealed) return;
    const p1 = iso(r.gx, r.gy);
    r.connections.forEach((cid) => {
      const tRoom = dng.rooms[cid];
      if (!tRoom.revealed) return;
      const p2 = iso(tRoom.gx, tRoom.gy);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });
  });

  dng.rooms.forEach((r) => {
    if (!r.revealed) return;
    const p = iso(r.gx, r.gy);
    const isCur = dng.currentRoomId === r.id;
    ctx.fillStyle = isCur
      ? "#ffffff"
      : r.isSecret
        ? "#d9b36c"
        : r.visited
          ? "#a69c8e"
          : "#4a433c";
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - 6);
    ctx.lineTo(p.x + 11, p.y);
    ctx.lineTo(p.x, p.y + 6);
    ctx.lineTo(p.x - 11, p.y);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#12100e";
    ctx.lineWidth = 1;
    ctx.stroke();

    if (r.visited && !r.cleared && r.type !== "entrance") {
      ctx.fillStyle = r.type === "boss" || r.type === "combat" ? "#ff4d45" : "#ffe28a";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

export function getDungeonHotspots(canvasWidth, canvasHeight) {
  if (state.screen !== "dungeon" || !state.dungeon || state.viewArtId) return [];

  const cur = state.dungeon.rooms[state.dungeon.currentRoomId];
  const spots = [];

  if (cur.type === "entrance") {
    spots.push({
      id: state.dungeon.depth === 1 ? "exit-dungeon-surface" : "dng-ascend-level",
      label: "[ASCEND ENTRANCE STAIRS]",
      x: 0.50,
      y: 0.56,
      r: 0.14
    });
  } else if (!cur.cleared) {
    if (cur.type === "combat") {
      spots.push({ id: "dng-fight", label: "[CONFRONT HORROR]", x: 0.50, y: 0.52, r: 0.14 });
    } else if (cur.type === "boss") {
      spots.push({ id: "dng-boss", label: "[CHALLENGE FLOOR BOSS]", x: 0.50, y: 0.52, r: 0.14 });
    } else if (cur.type === "treasure") {
      spots.push({ id: "dng-chest", label: "[OPEN CHEST]", x: 0.50, y: 0.68, r: 0.13 });
    } else if (cur.type === "painting") {
      spots.push({ id: "dng-painting", label: "[INSPECT WALL MURAL]", x: 0.50, y: 0.46, r: 0.14 });
    } else if (cur.type === "puzzle") {
      spots.push({ id: "dng-puzzle-mud", label: "[INSPECT COIN SCALE]", x: 0.50, y: 0.64, r: 0.13 });
    } else if (cur.type === "trap") {
      spots.push({ id: "dng-trap", label: "[DISARM SPIKE GRATE]", x: 0.50, y: 0.72, r: 0.13 });
    } else if (cur.type === "wandering") {
      spots.push({ id: "dng-wandering-talk", label: "[SPEAK: FROG-KNIGHT]", x: 0.50, y: 0.52, r: 0.14 });
    } else if (cur.type === "well") {
      spots.push({ id: "dng-well", label: "[GAZE INTO WELL]", x: 0.50, y: 0.68, r: 0.13 });
    }
  } else if (cur.type === "boss" && cur.cleared) {
    spots.push({
      id: "dng-descend-level",
      label: `[▼ DESCEND TO DEPTH ${state.dungeon.depth + 1}]`,
      x: 0.50,
      y: 0.60,
      r: 0.14
    });
  }

  // Minimap adjacent room doorway hotspots
  const boxW = 168;
  const bx = canvasWidth - boxW - 12;
  const by = 12;
  const cx = bx + boxW * 0.5;
  const cy = by + 34;
  const tw = 16;
  const th = 8.5;

  cur.connections.forEach((cid) => {
    const tRoom = state.dungeon.rooms[cid];
    if (!tRoom.revealed) return;
    const nx = (cx + (tRoom.gx - tRoom.gy) * tw) / canvasWidth;
    const ny = (cy + (tRoom.gx + tRoom.gy) * th) / canvasHeight;
    spots.push({
      id: `dng-move-${cid}`,
      label: tRoom.visited ? `[MOVE: ${tRoom.label.toUpperCase()}]` : "[DELVE: DOORWAY (?)]",
      x: nx,
      y: ny,
      r: 0.035
    });
  });

  return spots;
}

// ============================================================================
// 5. Dungeon Action Dispatcher (Returns true if handled)
// ============================================================================

export function handleDungeonAction(action) {
  if (!state.dungeon && action !== "exit-dungeon-surface") return false;

  const stats = getComputedStats();
  const darkMod = state.torchTurns === 0 ? -3 : 0;

  if (action === "exit-dungeon-surface") {
    state.dungeon = null;
    advanceTime(1);
    hooks.updateTimeHUD();
    hooks.openWorldMap();
    saveGame();
    return true;
  }

  if (action === "dng-descend-level") {
    const nextDepth = state.dungeon.depth + 1;
    spawnFloatText(0.5, 0.45, `DESCENDING TO DEPTH ${nextDepth}...`, "#ffe28a");
    generateDungeon(state.dungeon.id, nextDepth);
    return true;
  }

  if (action === "dng-ascend-level") {
    const prevDepth = Math.max(1, state.dungeon.depth - 1);
    generateDungeon(state.dungeon.id, prevDepth);
    return true;
  }

  if (action.startsWith("dng-move-")) {
    moveToDungeonRoom(parseInt(action.replace("dng-move-", ""), 10));
    return true;
  }

  if (action === "dng-resume") {
    state.screen = "dungeon";
    state.viewArtId = null;
    hooks.updateNavButtons();
    renderDungeonRoom();
    return true;
  }

  if (action === "dng-fight") {
    hooks.startEncounter(state.dungeon.tier === 2 ? "marionette" : "exile", false);
    return true;
  }

  if (action === "dng-boss") {
    hooks.startEncounter(state.dungeon.tier === 2 ? "marionette" : "exile", true);
    return true;
  }

  if (action === "dng-painting") {
    const d20 = Math.floor(Math.random() * 20) + 1;
    hooks.launchPhysicalDice(d20, stats.int + darkMod, "Inspect", () => {
      const cur = state.dungeon.rooms[state.dungeon.currentRoomId];
      const sec = cur.connections.map((cid) => state.dungeon.rooms[cid]).find((r) => r.isSecret);
      if (d20 + stats.int + darkMod >= 11 && sec) {
        sec.revealed = true;
        grantXP(35);
        spawnFloatText(0.5, 0.42, "SECRET ROOM UNCOVERED!", "#ffe28a");
        hooks.setDialogue(
          "Secret Mechanism Triggered!",
          "The Mural Slides Aside",
          `Rolled ${d20 + stats.int + darkMod} vs DC 11. Counterweights grind behind the stone—uncovering a <strong>Hidden Reliquary Vault</strong> (+35 XP)!`,
          [{ label: "Continue", action: "dng-resume" }]
        );
      } else {
        hooks.setDialogue(
          "Cold Stone",
          "Weeping Eyes",
          `Rolled ${d20 + stats.int + darkMod} vs DC 11. The painted eyes seem to follow your torch, though you find no latch yet.`,
          [{ label: "Continue", action: "dng-resume" }]
        );
      }
      hooks.updateHUD();
      saveGame();
    });
    return true;
  }

  if (action === "dng-puzzle-silver" || action === "dng-puzzle-mud") {
    const cur = state.dungeon.rooms[state.dungeon.currentRoomId];
    cur.cleared = true;
    const choseSilver = action === "dng-puzzle-silver";
    const correct = (choseSilver && stats.wil < 7) || (!choseSilver && stats.wil >= 7);
    if (correct) {
      state.sp += 22;
      grantXP(50);
      spawnFloatText(0.5, 0.45, "RIDDLE SOLVED! +50 XP", "#82d988");
      hooks.setDialogue(
        "The Keeper Nods",
        "Judgment Accepted",
        `The skeletal statue lowers its scales, yielding <strong>22 SP</strong> and <strong>+50 XP</strong>.`,
        [{ label: "Continue", action: "dng-resume" }]
      );
    } else {
      state.curses.add("dread");
      spawnFloatText(0.5, 0.45, "WRONG HAND! DREAD", "#ff4d45");
      hooks.setDialogue(
        "False Measure",
        "Curse of the Silent Keeper",
        `You misjudged the weight of your own Will! Cold terror hollows your eyes, inflicting <strong>Dread</strong>.`,
        [{ label: "Continue", action: "dng-resume" }]
      );
    }
    hooks.updateHUD();
    saveGame();
    return true;
  }

  if (action === "dng-trap") {
    const d20 = Math.floor(Math.random() * 20) + 1;
    hooks.launchPhysicalDice(d20, stats.int + darkMod, "Disarm", () => {
      state.dungeon.rooms[state.dungeon.currentRoomId].cleared = true;
      if (d20 + stats.int + darkMod >= 12) {
        grantXP(25);
        hooks.setDialogue(
          "Mechanism Jammed",
          "Spikes Retracted",
          `Rolled ${d20 + stats.int + darkMod} vs DC 12. You wedge an iron piton into the floor-plate (+25 XP).`,
          [{ label: "Continue", action: "dng-resume" }]
        );
      } else {
        state.hp = Math.max(1, state.hp - 3);
        hooks.setDialogue(
          "Sprung Trap!",
          "Pierced by Iron",
          `Rolled ${d20 + stats.int + darkMod} vs DC 12. Rusted spikes snap upward, piercing your greaves (-3 HP)!`,
          [{ label: "Continue", action: "dng-resume" }]
        );
      }
      hooks.updateHUD();
      saveGame();
    });
    return true;
  }

  if (action === "dng-wandering-talk") {
    state.viewArtId = "frogknight";
    hooks.setDialogue(
      "Wandering Soul // Close-Up",
      "The Exiled Frog-Knight",
      "He clutches his green frog-helm with trembling gauntlets. <em>\"Do not dare return without a cure... take this moss and torch, friend, before the dark swallows us both.\"</em>",
      [
        { label: "Accept his Aid (+1 Torch, +Night-Watch Moss)", action: "dng-wandering-aid" },
        { label: "← Step back to Corridor", action: "dng-resume" }
      ]
    );
    return true;
  }

  if (action === "dng-wandering-aid") {
    state.dungeon.rooms[state.dungeon.currentRoomId].cleared = true;
    addItem("Pitch Torch", 1);
    addItem("Night-Watch Moss", 1);
    grantXP(25);
    hooks.updateHUD();
    saveGame();
    return handleDungeonAction("dng-resume");
  }

  if (action === "dng-chest") {
    const d20 = Math.floor(Math.random() * 20) + 1;
    hooks.launchPhysicalDice(d20, stats.int + darkMod, "Disarm", () => {
      state.dungeon.rooms[state.dungeon.currentRoomId].cleared = true;
      if (d20 + stats.int + darkMod >= 12) {
        const lootSp = 15 + state.dungeon.depth * 8;
        state.sp += lootSp;
        grantXP(35);
        addItem("Hollow Reed-Bone", 1);
        addItem("Tallow Ration", 1);
        hooks.setDialogue(
          "Lock Sprung!",
          "Reliquary Opened",
          `Rolled ${d20 + stats.int + darkMod} vs DC 12. Inside you find <strong>${lootSp} SP</strong>, a <strong>Hollow Reed-Bone</strong>, a <strong>Tallow Ration</strong>, and +35 XP!`,
          [{ label: "Continue", action: "dng-resume" }]
        );
      } else {
        state.hp = Math.max(1, state.hp - 3);
        state.curses.add("blight");
        state.sp += 8;
        hooks.setDialogue(
          "Poison Needle Trap!",
          "Blight Inflicted",
          `Rolled ${d20 + stats.int + darkMod} vs DC 12. A rusted needle pierces your palm (-3 HP, afflicted with Blight), though you pry out 8 SP.`,
          [{ label: "Continue", action: "dng-resume" }]
        );
      }
      hooks.updateHUD();
      saveGame();
    });
    return true;
  }

  if (action === "dng-well") {
    const d20 = Math.floor(Math.random() * 20) + 1;
    hooks.launchPhysicalDice(d20, stats.wil + darkMod, "Well Gaze", () => {
      state.dungeon.rooms[state.dungeon.currentRoomId].cleared = true;
      if (d20 + stats.wil + darkMod >= 12) {
        grantXP(45);
        state.brandLevel = Math.min(10, state.brandLevel + 1);
        hooks.setDialogue(
          "The Reflection Yields",
          "Whispering Well",
          `Rolled ${d20 + stats.wil + darkMod} vs DC 12. The water reveals forgotten memories (+45 XP, +1 Soul-Brand).`,
          [{ label: "Continue", action: "dng-resume" }]
        );
      } else {
        state.curses.add("dread");
        hooks.setDialogue(
          "The Illusion Falters",
          "Hollow Reflection",
          `Rolled ${d20 + stats.wil + darkMod} vs DC 12. A stranger's bone-visage stares back from the water, inflicting <strong>Dread</strong>!`,
          [{ label: "Continue", action: "dng-resume" }]
        );
      }
      hooks.updateHUD();
      saveGame();
    });
    return true;
  }

  if (action === "dng-well-coin") {
    if (state.sp >= 2) {
      state.sp -= 2;
      state.hp = Math.min(state.maxHp, state.hp + 4);
      state.dungeon.rooms[state.dungeon.currentRoomId].cleared = true;
      hooks.updateHUD();
      saveGame();
      hooks.setDialogue(
        "Silver Accepted",
        "Blessing of the Deep",
        "Ripples swallow your silver coins, soothing your wounds (+4 HP).",
        [{ label: "Continue", action: "dng-resume" }]
      );
    }
    return true;
  }

  return false;
}