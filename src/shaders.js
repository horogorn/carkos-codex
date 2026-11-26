// ============================================================================
// THE CARKOS CODEX — WebGL 3D Raymarching Engine & SDF Prefabs
// Imports ONLY from ./lore.js and ./state.js.
// Environments only. Vessels, NPCs, and monsters are 2.5D plates.
// Environments (u_env):
//   0 = Miregate Town      1 = Modular Dungeon Room   2 = Whispering Well
//   3 = Quicksilver Fen    4 = Surface Camp           5 = Dungeon Camp
//   6 = Cinematic 3D Combat Arena
// Alpha is front transmittance up to u_entZ (straight alpha; the context
// is created with premultipliedAlpha: false so RGB stays unscaled).
// ============================================================================

import { PANTHEON } from "./lore.js";
import { state } from "./state.js";

const glCanvas = document.createElement("canvas");
const gl = glCanvas.getContext("webgl", {
  preserveDrawingBuffer: true,
  premultipliedAlpha: false,
  alpha: true
});

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
  uniform float u_propType;  // In Combat: 0=stone arena, 1=leviathan water, 2=pit floor. Bodies are 2D plates.
  uniform float u_propState; // In Combat: combatPulse; In Camp: totem level; In Dungeon: opened/cleared flag
  uniform float u_timePhase;
  uniform float u_entZ;      // Plate depth. Alpha = front transmittance up to this z.

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

  // Material IDs: 1=stone, 2=glowing relic, 3=warm torch/fire, 4=water.
  // Living figures are not in the distance field.
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
        propStone = sdStairwell(p - vec3(0.0, 0.0, 0.6), 0.0, er);
      } else if (u_propType < 1.5) {
        propStone = sdChestProp(p - vec3(0.0, -1.32, -0.4), u_propState, er);
        if (u_propState < 0.5) propGlow = sdBox(p - vec3(0.0, -1.25, -0.86), vec3(0.14, 0.14, 0.05));
      } else if (u_propType < 2.5) {
        propStone = sdWallPainting(p - vec3(0.0, -0.35, 2.15), u_propState, er);
        if (u_propState > 0.5) propGlow = sdOctahedron(p - vec3(0.0, -0.5, 2.3), 0.28);
      } else if (u_propType < 3.5) {
        propStone = sdBox(p - vec3(0.0, -1.58, -0.3), vec3(0.95, 0.08, 0.95)) + er * 0.5;
        if (u_propState < 0.5) {
          vec3 spP = p - vec3(0.0, -1.35, -0.3);
          spP.xz = mod(spP.xz + 0.22, 0.44) - 0.22;
          propGlow = sdCapsule(spP, vec3(0.0, -0.2, 0.0), vec3(0.0, 0.22, 0.0), 0.04);
        }
      } else if (u_propType < 4.5) {
        propStone = sdBox(p - vec3(0.0, -1.25, -0.3), vec3(0.55, 0.42, 0.55)) + er * 0.6;
        if (u_propState < 0.5) {
          vec3 aP = p - vec3(0.0, -0.45 + sin(u_time * 2.2) * 0.1, -0.3);
          aP.xz *= rot(u_time * 0.9);
          propGlow = sdOctahedron(aP, 0.36);
        }
      } else if (u_propType < 6.5) {
        propStone = sdStairwell(p - vec3(0.0, 0.0, 0.4), 1.0, er);
        propGlow = sdOctahedron(p - vec3(0.0, -1.2, 0.9), 0.25);
      }

      float stone = min(floorD, min(backWall, min(smin(pillar, arch, 0.25), propStone)));
      vec2 res = vec2(stone, 1.0);
      if (propGlow < res.x) res = vec2(propGlow, 2.0);
      return res;
    }
    // --- ENV 2: WHISPERING WELL ---
    else if (u_env < 2.5) {
      vec3 rp = p;
      rp.z = mod(rp.z + 1.5, 3.0) - 1.5;
      float rib = max(abs(length(rp.xy - vec2(0.0, -0.2)) - 2.75) - 0.24, abs(rp.z) - 0.24) + er * 0.9;
      float wDist = length(p.xz - vec2(0.0, -0.4));
      float floorD = max(p.y + 1.6 + er * 0.5, -(wDist - 0.95));
      float wellRim = max(abs(wDist - 1.05) - 0.18, abs(p.y + 1.25) - 0.38) + er * 0.7;
      float stone = min(rib, min(floorD, wellRim));
      float water = max(p.y + 1.32 + sin(wDist * 14.0 - u_time * 3.0) * 0.02, wDist - 0.95);
      vec2 res = vec2(stone, 1.0);
      if (water < res.x) res = vec2(water, 4.0);
      return res;
    }
    // --- ENV 3: QUICKSILVER FEN ---
    else if (u_env < 3.5) {
      float water = p.y + 1.55 + sin(length(p.xz) * 5.0 - u_time * 2.2) * 0.03 + gyroid(p * 3.0 + u_time * 0.5) * 0.02;
      vec3 mp = p;
      mp.x = mod(mp.x + 2.4, 4.8) - 2.4;
      mp.z = mod(mp.z + 2.6, 5.2) - 2.6;
      float ruin = sdBox(mp - vec3(0.0, -0.5, 0.0), vec3(0.32, 1.4, 0.32)) + er * 0.9;
      vec2 res = vec2(ruin, 1.0);
      if (water < res.x) res = vec2(water, 4.0);
      return res;
    }
    // --- ENV 4 & 5: SURFACE & DUNGEON CAMPS ---
    else if (u_env < 5.5) {
      float ground = p.y + 1.62 + er * 0.65;
      float shell = 99.0;
      if (u_env < 4.5) {
        vec3 tp = p;
        tp.x = abs(tp.x) - 2.75;
        tp.z = mod(tp.z + 2.0, 4.0) - 2.0;
        shell = length(tp.xz) - 0.34 + er * 0.9;
      } else {
        vec3 rp = p;
        rp.z = mod(rp.z + 1.6, 3.2) - 1.6;
        shell = max(abs(length(rp.xy - vec2(0.0, -0.2)) - 2.55) - 0.24, abs(rp.z) - 0.24) + er * 0.9;
      }

      float totH = 0.65 + u_propState * 0.22;
      float totem = sdCapsule(p - vec3(-1.65, -1.6, 0.2), vec3(0.0, 0.0, 0.0), vec3(0.0, totH * 2.0, 0.0), 0.15) + er * 0.5;
      float totOrb = length(p - vec3(-1.65, -1.6 + totH * 2.1, 0.2)) - (u_propState > 1.5 ? 0.18 : 0.01);

      vec3 anvP = p - vec3(1.55, -1.35, -0.6);
      float anvil = min(sdBox(anvP, vec3(0.24, 0.24, 0.2)), sdBox(anvP - vec3(0.0, 0.26, 0.0), vec3(0.42, 0.11, 0.2))) + er * 0.4;

      vec3 fP = p - vec3(0.15, -1.55, -0.85);
      float hearthRing = max(abs(length(fP.xz) - 0.48) - 0.11, abs(fP.y) - 0.11) + er * 0.8;

      float stone = min(ground, min(shell, min(totem, min(anvil, hearthRing))));
      float fH = 0.35 + u_propType * 0.12 + sin(u_time * 12.0) * 0.06;
      float flame = length((fP - vec3(0.0, fH, 0.0)) * vec3(1.5, 0.65, 1.5)) - 0.24 + gyroid(fP * 9.0 + u_time * 4.5) * 0.04;

      vec2 res = vec2(stone, 1.0);
      if (totOrb < res.x) res = vec2(totOrb, 2.0);
      if (flame < res.x) res = vec2(flame, 3.0);
      return res;
    }
    // --- ENV 6: CINEMATIC 3D COMBAT CONFRONTATION ---
    else {
      float groundMat = (u_propType > 0.5 && u_propType < 1.5) ? 4.0 : 1.0;
      float ground = p.y + 1.65 + (groundMat > 3.5 ? sin(length(p.xz) * 6.0 - u_time * 2.5) * 0.03 : er * 0.6);

      vec3 q = p;
      q.x = abs(q.x) - 3.1;
      q.z = mod(q.z + 2.2, 4.4) - 2.2;
      float pillars = length(q.xz) - 0.42 + er;

      vec2 res = vec2(min(ground, pillars), groundMat);
      return res;
    }
  }

  vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.004, 0.0);
    return normalize(vec3(
      map(p + e.xyy).x - map(p - e.xyy).x,
      map(p + e.yxy).x - map(p - e.yxy).x,
      map(p + e.yyx).x - map(p - e.yyx).x
    ));
  }

  float calcAO(vec3 pos, vec3 nor) {
    float occ = 0.0, sca = 1.0;
    for (int i = 0; i < 4; i++) {
      float h = 0.05 + 0.18 * float(i);
      occ += (h - map(pos + h * nor).x) * sca;
      sca *= 0.72;
    }
    return clamp(1.0 - 2.1 * occ, 0.0, 1.0);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;

    vec3 ro = (u_env > 5.5)
      ? vec3(-0.45 + sin(u_time * 0.35) * 0.08, -0.58 + cos(u_time * 0.4) * 0.04, -3.75)
      : vec3(sin(u_time * 0.22) * 0.20, -0.05 + cos(u_time * 0.3) * 0.05, -4.35);
    vec3 lookTarget = (u_env > 5.5) ? vec3(0.15, 0.05, 0.8) : vec3(0.0, -0.08, 0.0);

    vec3 f = normalize(lookTarget - ro);
    vec3 r = normalize(cross(vec3(0.0, 1.0, 0.0), f));
    vec3 u = cross(f, r);
    vec3 rd = normalize(f * 1.18 + uv.x * r + uv.y * u);

    float t = 0.0, mat = 0.0;
    for (int i = 0; i < 64; i++) {
      vec2 h = map(ro + rd * t);
      if (h.x < 0.004) {
        mat = h.y;
        break;
      }
      t += h.x * 0.85;
      if (t > 18.0) break;
    }

    vec3 col = vec3(0.0);
    vec3 timeSky = vec3(0.45, 0.42, 0.36);
    if (u_timePhase > 0.5 && u_timePhase < 1.5) timeSky = vec3(0.52, 0.34, 0.24);
    else if (u_timePhase > 1.5 && u_timePhase < 2.5) timeSky = vec3(0.24, 0.30, 0.42);
    else if (u_timePhase > 2.5) timeSky = vec3(0.55, 0.14, 0.16);

    if (u_env < 0.5 || (u_env > 2.5 && u_env < 4.5)) {
      vec2 haloPos = (u_env > 3.5) ? vec2(0.32, 0.28) : vec2(0.0, 0.16);
      float halo = smoothstep(0.68, 0.04, length(uv - haloPos));
      col += mix(timeSky, u_godCol, 0.25) * halo * 0.36;
    } else if (u_env > 5.5) {
      float mHalo = smoothstep(0.75, 0.05, length(uv - vec2(0.22, 0.18)));
      col += mix(vec3(0.22, 0.16, 0.15), u_godCol, 0.4) * mHalo * (0.22 + u_propState * 0.55);
    }

    float fogDensity = (u_env > 5.5) ? 0.026 : 0.018;

    if (mat > 0.5) {
      vec3 p = ro + rd * t;
      vec3 n = calcNormal(p);
      float ao = calcAO(p, n);
      float flick = 1.0 + sin(u_time * 15.0) * 0.05;

      vec3 lTarget = (u_env > 5.5)
        ? vec3(u_mouse.x * 2.6, u_mouse.y * 1.8, 0.6)
        : vec3(u_mouse.x * 2.8, u_mouse.y * 1.9, -2.5);
      vec3 lDir = lTarget - p;
      float lDist = length(lDir);
      float diff = max(dot(n, lDir / lDist), 0.0);
      // The strike pulse used to light a floor that the hero and monster SDFs
      // covered. Those bodies are plates now, so the same *3 boost clips the
      // open floor into █. *1.1 still kicks the arena without crossing the
      // 0.97 hotspot gate.
      float atten = (2.4 * flick + (u_env > 5.5 ? u_propState * 1.1 : 0.0)) / (1.0 + lDist * lDist * 0.24);

      vec3 envLight = vec3(0.0);
      if (u_env > 5.5) {
        vec3 hDir = vec3(-0.62, -0.78, -1.55) - p;
        float hDist = length(hDir);
        envLight = vec3(1.0, 0.72, 0.36) * max(dot(n, hDir / hDist), 0.0) * (2.2 * flick / (1.0 + hDist * hDist * 0.65));
      } else if (u_env > 3.5) {
        vec3 cDir = vec3(0.15, -1.05, -0.85) - p;
        float cDist = length(cDir);
        envLight = vec3(1.0, 0.65, 0.28) * max(dot(n, cDir / cDist), 0.0) * (3.1 * flick / (1.0 + cDist * cDist * 0.42));
      } else if (u_env < 0.5) {
        vec3 tDir = vec3(0.0, -0.6, -1.4) - p;
        float tDist = length(tDir);
        envLight = timeSky * max(dot(n, tDir / tDist), 0.0) * (1.9 / (1.0 + tDist * tDist * 0.35));
      }

      float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.8);

      vec3 baseTone = vec3(0.78, 0.74, 0.67);
      if (mat > 3.5) baseTone = vec3(0.68, 0.85, 0.92);
      else if (mat > 2.5) baseTone = vec3(1.0, 0.86, 0.45);
      else if (mat > 1.5) baseTone = u_godCol * 1.25;

      col = baseTone * (diff * atten + 0.08) * ao + envLight * ao + u_godCol * rim * (mat > 1.5 ? 1.1 : 0.36) * ao;
      if (mat > 2.5 && mat < 3.5) col += baseTone * 0.75;

      // Stone only. Fire and relics may still clear the 0.97 hotspot gate.
      // The open arena floor, no longer covered by a body SDF, was crossing it
      // on a strike and drawing a band of █.
      if (mat < 1.5) {
        float stoneLum = dot(col, vec3(0.299, 0.587, 0.114));
        if (stoneLum > 0.96) col *= 0.96 / stoneLum;
      }

      col = mix(vec3(0.012), col, exp(-fogDensity * t * t));
    }

    float tFront = (u_entZ - ro.z) / max(rd.z, 0.05);
    tFront = clamp(tFront, 0.0, 18.0);
    float frontT = exp(-fogDensity * tFront * tFront);
    gl_FragColor = vec4(pow(clamp(col, 0.0, 1.0), vec3(0.84)), frontT);
  }
`;

// ============================================================================
// WebGL Initialization & Exported Render API
// ============================================================================

function compileShader(type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("[Carkos WebGL] Shader compile error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initWebGL() {
  if (!gl) {
    console.error("[Carkos WebGL] WebGL context could not be initialized.");
    return;
  }

  const vs = compileShader(gl.VERTEX_SHADER, vertSrc);
  const fs = compileShader(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);

  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error("[Carkos WebGL] Program link error:", gl.getProgramInfoLog(prog));
    return;
  }

  gl.useProgram(prog);

  const vBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, vBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const posLoc = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

  U = {
    res: gl.getUniformLocation(prog, "u_res"),
    time: gl.getUniformLocation(prog, "u_time"),
    mouse: gl.getUniformLocation(prog, "u_mouse"),
    env: gl.getUniformLocation(prog, "u_env"),
    godCol: gl.getUniformLocation(prog, "u_godCol"),
    propType: gl.getUniformLocation(prog, "u_propType"),
    propState: gl.getUniformLocation(prog, "u_propState"),
    timePhase: gl.getUniformLocation(prog, "u_timePhase"),
    entZ: gl.getUniformLocation(prog, "u_entZ")
  };

  programReady = true;
  resizeWebGL(currentCols, currentRows);
}

export function resizeWebGL(cols, rows) {
  currentCols = cols;
  currentRows = rows;
  glCanvas.width = cols;
  glCanvas.height = rows;
  if (gl) {
    gl.viewport(0, 0, cols, rows);
  }
  glPixels = new Uint8Array(cols * rows * 4);
}

export function renderWebGLFrame(envCode, propType, propState, entZ = 0) {
  if (!programReady || !gl || !U) return glPixels;

  gl.uniform2f(U.res, currentCols, currentRows);
  gl.uniform1f(U.time, state.time);
  gl.uniform2f(U.mouse, state.pointerX * 2 - 1, -(state.pointerY * 2 - 1));
  gl.uniform1f(U.env, envCode);
  gl.uniform3fv(U.godCol, PANTHEON[state.godKey].rgb);
  gl.uniform1f(U.propType, propType);
  gl.uniform1f(U.propState, propState);
  gl.uniform1f(U.timePhase, state.timeIdx);
  gl.uniform1f(U.entZ, entZ);

  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.readPixels(0, 0, currentCols, currentRows, gl.RGBA, gl.UNSIGNED_BYTE, glPixels);
  const attrs = gl.getContextAttributes();
  if (attrs && attrs.premultipliedAlpha) {
    for (let i = 0; i < glPixels.length; i += 4) {
      const a = glPixels[i + 3];
      if (a === 0 || a === 255) continue;
      const s = 255 / a;
      glPixels[i] = Math.min(255, glPixels[i] * s);
      glPixels[i + 1] = Math.min(255, glPixels[i + 1] * s);
      glPixels[i + 2] = Math.min(255, glPixels[i + 2] * s);
    }
  }
  return glPixels;
}

export function getLastWebGLPixels() {
  return glPixels;
}

export function isWebGLReady() {
  return programReady;
}

initWebGL();