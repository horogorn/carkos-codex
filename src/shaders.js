// ============================================================================
// THE CARKOS CODEX — WebGL 3D Raymarching Engine & SDF Prefabs
// Imports ONLY from ./lore.js and ./state.js.
// Environments (u_env):
//   0 = Miregate Town      1 = Modular Dungeon Room   2 = Whispering Well
//   3 = Quicksilver Fen    4 = Surface Camp           5 = Dungeon Camp
//   6 = Cinematic 3D Combat Arena
// ============================================================================

import { CLASSES, PANTHEON } from "./lore.js";
import { state } from "./state.js";

const glCanvas = document.createElement("canvas");
const gl = glCanvas.getContext("webgl", { preserveDrawingBuffer: true });

let currentCols = 132;
let currentRows = 80;
let glPixels = new Uint8Array(currentCols * currentRows * 4);
let programReady = false;
let U = null;

// ============================================================================
// GLSL Shaders (Vertex + Raymarching Fragment)
// ============================================================================

const vertSrc = `
  attribute vec2 a_pos;
  void main() {
    gl_Position = vec4(a_pos, 0.0, 1.0);
  }
`;

const fragSrc = `
  precision highp float;
  uniform vec2 u_res;
  uniform float u_time;
  uniform vec2 u_mouse;
  uniform float u_env;       // 0=Town, 1=Dungeon Room, 2=Dungeon Well, 3=Fen, 4=Surface Camp, 5=Dungeon Camp, 6=Cinematic Combat
  uniform vec3 u_godCol;
  uniform float u_propType;  // In Combat: 0=Bone Colossus, 1=Mire Leviathan, 2=Pit-Beast
  uniform float u_propState; // In Combat: combatPulse; In Camp: totem level; In Dungeon: opened/cleared flag
  uniform float u_timePhase;
  uniform float u_gearId;

  mat2 rot(float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c);
  }

  float gyroid(vec3 p) {
    return dot(sin(p), cos(p.yzx));
  }

  float fbmErosion(vec3 p) {
    return gyroid(p * 2.3) * 0.5
         + gyroid(p * 4.9 + 1.2) * 0.25
         + gyroid(p * 9.8 + 2.5) * 0.125;
  }

  float sdBox(vec3 p, vec3 b) {
    vec3 q = abs(p) - b;
    return length(max(q, 0.0)) + min(max(q.x, max(q.y, q.z)), 0.0);
  }

  float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
  }

  float sdCapsule(vec3 p, vec3 a, vec3 b, float r) {
    vec3 pa = p - a, ba = b - a;
    float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
    return length(pa - ba * h) - r;
  }

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  // --- TOWN BUILDING PREFABS ---
  float sdPeakedTavern(vec3 p, float er) {
    float body = sdBox(p, vec3(0.78, 0.78, 0.78));
    vec3 rP = p - vec3(0.0, 1.05, 0.0);
    rP.xy *= rot(0.785);
    float roof = max(sdBox(rP, vec3(0.64, 0.64, 0.88)), -(p.y - 0.72));
    return min(body, roof) + er * 0.45;
  }

  float sdBellShrine(vec3 p, float er) {
    float arch = max(abs(length(p.xy - vec2(0.0, -0.05)) - 0.85) - 0.16, abs(p.z) - 0.24);
    arch = max(arch, -p.y - 0.85);
    float spire = sdOctahedron((p - vec3(0.0, 1.15, 0.0)) * vec3(1.8, 0.65, 1.8), 0.42);
    return min(arch, spire) + er * 0.65;
  }

  float sdSmithyForge(vec3 p, float er) {
    float hall = sdBox(p, vec3(0.76, 0.68, 0.76));
    float chimney = sdBox(p - vec3(0.38, 1.12, 0.0), vec3(0.22, 0.62, 0.22));
    return min(hall, chimney) + er * 0.5;
  }

  // --- DUNGEON PROPS ---
  float sdChestProp(vec3 p, float open, float er) {
    float base = sdBox(p, vec3(0.72, 0.30, 0.44));
    vec3 lidP = p - vec3(0.0, 0.32, 0.35);
    if (open > 0.5) lidP.yz *= rot(-0.75);
    float lid = sdBox(lidP - vec3(0.0, 0.06, -0.35), vec3(0.74, 0.14, 0.46));
    return min(base, lid) + er * 0.4;
  }

  float sdWallPainting(vec3 p, float tilted, float er) {
    vec3 mP = p;
    if (tilted > 0.5) {
      mP.xy *= rot(0.28);
      mP.x -= 0.45;
    }
    return min(
      sdBox(mP, vec3(0.95, 0.75, 0.08)),
      sdBox(mP - vec3(0.0, 0.0, -0.03), vec3(0.78, 0.58, 0.06))
    ) + er * 0.25;
  }

  float sdStairwell(vec3 p, float goingDown, float er) {
    float steps = 99.0;
    for (int s = 0; s < 5; s++) {
      float fs = float(s);
      float sy = goingDown > 0.5 ? (-1.55 - fs * 0.18) : (-1.55 + fs * 0.22);
      steps = min(steps, sdBox(p - vec3(0.0, sy, -0.8 + fs * 0.34), vec3(0.85, 0.12, 0.22)));
    }
    return steps + er * 0.45;
  }

  // --- PROTAGONIST SILHOUETTE (SEATED IN CAMP OR STANDING IN COMBAT) ---
  float sdPilgrim(vec3 p, float gearId, float standing) {
    float hScale = standing > 0.5 ? 1.35 : 1.0;
    float body = sdCapsule(p, vec3(0.0, -0.45 * hScale, 0.05), vec3(0.06, 0.30 * hScale, -0.05), 0.33);
    float cowl = length(p - vec3(0.08, 0.36 * hScale, -0.08)) - 0.22;
    float base = smin(body, cowl, 0.12);

    vec3 hP = p - vec3(0.10, 0.56 * hScale, -0.10);
    float head = length(hP) - 0.18;

    if (gearId < 0.5) {
      head = min(head, min(
        sdCapsule(hP, vec3(-0.11, 0.12, 0.0), vec3(-0.22, 0.35, 0.0), 0.035),
        sdCapsule(hP, vec3( 0.11, 0.12, 0.0), vec3( 0.22, 0.35, 0.0), 0.035)
      ));
    } else if (gearId < 1.5) {
      float brim = length((hP - vec3(0.0, 0.11, 0.0)) * vec3(1.0, 4.0, 1.0)) - 0.32;
      float beak = sdCapsule(hP, vec3(0.10, -0.02, -0.04), vec3(0.44, -0.12, 0.12), 0.05);
      head = min(head, min(brim, beak));
    } else if (gearId < 2.5) {
      head = smin(head, sdCapsule(hP, vec3(0.0, 0.0, 0.0), vec3(-0.06, 0.40, 0.04), 0.13), 0.08);
    } else if (gearId < 3.5) {
      head = min(head, sdCapsule(p, vec3(0.30, -0.5 * hScale, -0.15), vec3(0.24, 0.85 * hScale, -0.12), 0.03));
    } else if (gearId < 4.5) {
      head = min(head, sdOctahedron((hP - vec3(0.0, 0.22, 0.0)) * vec3(1.5, 0.65, 1.5), 0.26));
    } else {
      float antL = sdCapsule(hP, vec3(-0.08, 0.14, 0.0), vec3(-0.26, 0.45, 0.04), 0.03);
      float antR = sdCapsule(hP, vec3( 0.08, 0.14, 0.0), vec3( 0.26, 0.45, -0.04), 0.03);
      head = min(head, min(antL, antR));
    }
    return smin(base, head, 0.08);
  }

  // --- COLOSSAL 3D MONSTERS FOR COMBAT CONFRONTATIONS ---
  // Returns vec2(monsterDist, glowingEyesDist)
  vec2 sdColossalMonster(vec3 p, float mType, float er) {
    if (mType < 0.5) {
      // 0: THE BONE-SWORN COLOSSUS (Towering Horned Giant + Monolith Cleaver)
      float torso = sdCapsule(p, vec3(0.0, -1.5, 0.0), vec3(-0.15, 0.75, -0.25), 0.72 - (p.y + 1.5) * 0.12);
      float shL = length(p - vec3(-0.85, 0.55, -0.15)) - 0.48;
      float shR = length(p - vec3( 0.78, 0.62, -0.10)) - 0.52;
      vec3 hP = p - vec3(-0.22, 1.15, -0.45);
      float helm = sdOctahedron(hP * vec3(1.1, 0.85, 1.1), 0.55);
      float hornL = sdCapsule(hP, vec3(-0.25, 0.2, 0.0), vec3(-0.75, 0.85, -0.2), 0.07);
      float hornR = sdCapsule(hP, vec3( 0.25, 0.2, 0.0), vec3( 0.75, 0.85, -0.2), 0.07);
      float blade = sdBox(p - vec3(-1.15, -0.35, -0.65), vec3(0.14, 1.35, 0.06));
      float body = smin(min(torso, min(shL, shR)), min(helm, min(hornL, hornR)), 0.18);
      body = min(body, blade) + er * 0.85;

      float eyes = min(
        length(hP - vec3(-0.14, 0.02, -0.38)) - 0.07,
        length(hP - vec3( 0.12, 0.02, -0.38)) - 0.07
      );
      return vec2(body, eyes);

    } else if (mType < 1.5) {
      // 1: THE MIRE-LEVIATHAN (Gaunt Serpentine Apparition with Detached Jaw)
      float neck = sdCapsule(p, vec3(0.0, -1.6, 0.2), vec3(-0.25, 1.05, -0.35), 0.44);
      vec3 rp = p;
      rp.y = mod(rp.y + 0.2, 0.4) - 0.2;
      float ribs = sdCapsule(rp - vec3(0.0, 0.0, 0.15), vec3(-0.65, 0.0, 0.0), vec3(0.65, 0.0, 0.0), 0.08);
      vec3 hP = p - vec3(-0.30, 1.28, -0.50);
      float skull = length(hP * vec3(1.15, 0.85, 1.0)) - 0.48;
      float jaw = sdBox(hP - vec3(0.0, -0.52 + sin(u_time * 3.0) * 0.06, -0.12), vec3(0.24, 0.14, 0.28));
      float body = smin(neck, min(ribs, min(skull, jaw)), 0.15) + er * 0.95;

      float eyes = min(
        length(hP - vec3(-0.18, 0.06, -0.42)) - 0.08,
        length(hP - vec3( 0.14, 0.06, -0.42)) - 0.08
      );
      return vec2(body, eyes);

    } else {
      // 2: THE PIT-BEAST (Towering Quadruped with Crown of Dorsal Spines)
      float hump = length((p - vec3(0.15, 0.35, 0.25)) * vec3(0.85, 0.95, 0.72)) - 0.95;
      float legFL = sdCapsule(p, vec3(-0.65, 0.25, -0.45), vec3(-0.85, -1.65, -0.65), 0.22);
      float legFR = sdCapsule(p, vec3( 0.75, 0.25, -0.35), vec3( 0.95, -1.65, -0.55), 0.22);
      float legBL = sdCapsule(p, vec3(-0.55, 0.35,  0.65), vec3(-0.70, -1.65,  0.85), 0.24);
      float legBR = sdCapsule(p, vec3( 0.65, 0.35,  0.75), vec3( 0.85, -1.65,  0.95), 0.24);
      vec3 hP = p - vec3(-0.25, 0.42, -0.75);
      float snout = sdOctahedron(hP * vec3(1.0, 1.1, 0.85), 0.56);
      float crownSpikes = min(
        min(
          sdCapsule(hP, vec3(-0.2, 0.2, 0.1), vec3(-0.55, 0.75, 0.25), 0.06),
          sdCapsule(hP, vec3( 0.2, 0.2, 0.1), vec3( 0.55, 0.75, 0.25), 0.06)
        ),
        sdCapsule(hP, vec3(0.0, 0.25, 0.15), vec3(0.0, 0.88, 0.35), 0.07)
      );
      float body = smin(hump, min(min(legFL, legFR), min(legBL, legBR)), 0.22);
      body = smin(body, min(snout, crownSpikes), 0.16) + er * 0.95;

      float eyes = min(
        length(hP - vec3(-0.20, 0.08, -0.42)) - 0.095,
        length(hP - vec3( 0.16, 0.08, -0.42)) - 0.095
      );
      return vec2(body, eyes);
    }
  }

  float sdFigure(vec3 p, float tall) {
    float cloak = sdCapsule(p, vec3(0.0, -1.5, 0.0), vec3(0.0, tall * 0.3, 0.0), 0.42 - (p.y + 1.5) * 0.11);
    float sh = length(p - vec3(0.0, tall * 0.25, 0.0)) - 0.36;
    float hd = sdOctahedron(p - vec3(0.0, tall * 0.58, 0.0), 0.28);
    return smin(min(cloak, sh), hd, 0.12);
  }

  // Material IDs: 1=stone/flesh, 2=glowing relic/monster eyes, 3=warm torch/fire, 4=water, 5=hero silhouette
  vec2 map(vec3 p) {
    float er = fbmErosion(p) * 0.048;

    // --- ENV 0: TOWN OF MIREGATE ---
    if (u_env < 0.5) {
      float ground = p.y + 1.65 + er * 0.6;
      vec3 skP = p - vec3(0.0, 1.25, 4.8);
      float skullMount = max(
        smin(length(skP) - 2.1 + er * 1.4, sdBox(skP - vec3(0.0, -1.65, 0.2), vec3(1.25, 0.75, 1.1)) + er, 0.45),
        -min(length(skP - vec3(-0.72, -0.15, -1.75)) - 0.48, length(skP - vec3(0.72, -0.15, -1.75)) - 0.48)
      );

      float tavern = sdPeakedTavern(p - vec3(-1.85, -0.85, -0.6), er);
      float shrine = sdBellShrine(p - vec3(0.0, -0.75, -0.3), er);
      float smith  = sdSmithyForge(p - vec3(1.85, -0.95, -0.6), er);
      float stone = min(ground, min(skullMount, min(tavern, min(shrine, smith))));

      float win = sdBox(p - vec3(-1.75, -0.95, -1.38), vec3(0.18, 0.22, 0.05));
      float forgeGlow = length(p - vec3(1.70, -1.30, -1.38)) - (0.22 + sin(u_time * 10.0) * 0.03);
      float warm = min(win, forgeGlow);
      float rune = sdOctahedron(p - vec3(0.0, -0.65 + sin(u_time * 2.5) * 0.08, -0.3), 0.24);

      vec2 res = vec2(stone, 1.0);
      if (warm < res.x) res = vec2(warm, 3.0);
      if (rune < res.x) res = vec2(rune, 2.0);
      return res;
    }
    // --- ENV 1: MODULAR 3D DUNGEON ROOM ---
    else if (u_env < 1.5) {
      float floorD = p.y + 1.65 + er * 0.6;
      vec3 q = p;
      q.x = abs(q.x) - 2.35;
      q.z = mod(q.z + 1.8, 3.6) - 1.8;
      float pillar = length(q.xz) - 0.38 + sin(atan(q.z, q.x) * 8.0) * 0.035 + er;

      vec3 ap = p;
      ap.z = mod(ap.z + 1.8, 3.6) - 1.8;
      ap.x = abs(ap.x);
      float arch = max(max(abs(length(ap.xy - vec2(-0.45, 0.35)) - 2.85) - 0.23, abs(ap.z) - 0.22), -ap.y + 0.05) + er * 0.8;

      float backWall = sdBox(p - vec3(0.0, 0.2, 2.6), vec3(3.2, 2.4, 0.35)) + er * 0.7;
      if (u_propType > 1.5 && u_propType < 2.5 && u_propState > 0.5) {
        float secretGap = sdBox(p - vec3(0.0, -0.5, 2.6), vec3(0.65, 1.15, 0.6));
        backWall = max(backWall, -secretGap);
      }

      float propStone = 99.0;
      float propGlow = 99.0;

      if (u_propType < 0.5) {
        propStone