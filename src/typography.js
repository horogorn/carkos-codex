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
 * Default shade ramp. Ten glyphs, strictly increasing by mean alpha.
 *
 * Measurement (headless Chrome, offscreen canvas, Cousine Bold 8px):
 *   textBaseline "top", fillStyle white, fillText at (0, 0). Coverage is the
 *   mean alpha inside the rasterizer's 6×8 cell, divided by 255. A count of
 *   pixels with alpha > 16 treats antialiasing fringe as solid ink and made
 *   ░/▒ look heavier than @. Mean alpha does not.
 *   Mean alpha: space 0, . 0.025, : 0.050, ; 0.075, * 0.094, + 0.141,
 *   = 0.154, # 0.208, % 0.258, @ 0.287.
 *   Block glyphs under the same measure: ░ 0.143, ▒ 0.262, █ 0.804.
 *   ░ sits next to + and ▒ sits just under @, so a ramp that places the
 *   blocks after @ is not monotone. Those two stay on the `blocks` preset.
 *   █ is not a step. Non-edge cells at luminance >= HOTSPOT_LUM use it
 *   (mitre spikes, eyes, ember cores).
 */
export const RAMP_DENSITY = " .:;*+=#%@";

/** Alt punctuation ramp for the dev toggle. Not reordered. */
export const RAMP_PUNCT = " .:~*=+#%@";

/**
 * Previous default. Kept so `?ramp=blocks` can still show the flat block tiers.
 * Mean alpha is not monotone here: @ 0.287, then ░ 0.143, then ▒ 0.262.
 */
export const RAMP_BLOCKS = " .·:;+#%@░▒";

export const RAMP_PRESETS = [
  { id: "legacy", label: "legacy", glyphs: RAMP_LEGACY, hotspot: false },
  { id: "density", label: "density", glyphs: RAMP_DENSITY, hotspot: true },
  { id: "punct", label: "punct", glyphs: RAMP_PUNCT, hotspot: true },
  { id: "blocks", label: "blocks", glyphs: RAMP_BLOCKS, hotspot: true }
];

export const DEFAULT_RAMP_ID = "density";

/**
 * Non-edge cells at or above this source luminance draw █.
 * Mitre stroke #f2eadc is 0.921 with the rasterizer's 0.299/0.587/0.114
 * weights, so the gate is 0.92. A gate of 0.93 leaves those spikes on @.
 */
export const HOTSPOT_LUM = 0.92;

/**
 * Luminance gap of two steps on the shortest presets (density and punct,
 * 10 glyphs each, so this stays 0.2). A subject fill this far above the
 * brightest forge glow stays at least two steps away on every dev ramp.
 */
export const RAMP_SEPARATION =
  2 / Math.min(...RAMP_PRESETS.map((preset) => preset.glyphs.length));
