// ============================================================================
// THE CARKOS CODEX — Shared typeface and ASCII shade ramps
// No imports. Leaf module for the rasterizer, overlays, and forge fills.
// ============================================================================

/** Self-hosted Cousine (fonts/, SIL OFL), then the old system stack. */
export const FONT_STACK = '"Cousine", "Courier New", Courier, monospace';

export function canvasFont(sizePx) {
  return `bold ${sizePx}px ${FONT_STACK}`;
}

/** Shipped ramp, including letters and a terminal block. Dev A/B only. */
export const RAMP_LEGACY = " .·,:;░▒+itIYVXRBM#%@█";

/**
 * Default shade ramp. Candidate glyphs were " .·:;░+▒#%@", then sorted by
 * measured ink so coverage only increases.
 *
 * Measurement (headless Chrome, offscreen canvas, 2026-11-25):
 *   @font-face Cousine Bold from fonts/Cousine-Bold.ttf,
 *   ctx.font = 'bold 8px "Cousine"', textBaseline "top", fillText at (0, 0),
 *   count pixels with alpha > 16 inside the rasterizer's 6×8 cell (48 px).
 *   Ties keep the candidate's original order.
 *   Ink/48: space 0, . 2, · 4, : 4, ; 7, + 10, # 19, % 23, @ 27, ░ 35, ▒ 40.
 *   In this face at 8px, ░ and ▒ are the heaviest steps, so they close the ramp.
 *   █ is not a step. The rasterizer draws it only when source luminance >= 0.97
 *   (eyes, ember cores, the skull crescent).
 */
export const RAMP_DENSITY = " .·:;+#%@░▒";

/** Alt punctuation ramp for the dev toggle. Not reordered. */
export const RAMP_PUNCT = " .:~*=+#%@";

export const RAMP_PRESETS = [
  { id: "legacy", label: "legacy", glyphs: RAMP_LEGACY, hotspot: false },
  { id: "density", label: "density", glyphs: RAMP_DENSITY, hotspot: true },
  { id: "punct", label: "punct", glyphs: RAMP_PUNCT, hotspot: true }
];

export const DEFAULT_RAMP_ID = "density";

export const HOTSPOT_LUM = 0.97;

/**
 * Luminance gap of two steps on the shortest preset (the punctuation ramp,
 * 10 glyphs). A subject fill this far above the brightest forge glow stays
 * at least two steps away on every dev ramp, including the wider default.
 */
export const RAMP_SEPARATION =
  2 / Math.min(...RAMP_PRESETS.map((preset) => preset.glyphs.length));
