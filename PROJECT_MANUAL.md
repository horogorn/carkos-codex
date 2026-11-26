# THE CARKOS CODEX — Project Manual

Last updated: 2026-11-26
Project version: v9.2 Modular Build

This manual describes the current codebase and the rules for changing it. It is part of the project and MUST be updated for every project edit, including code, HTML, CSS, assets, dependencies, commands, and documentation.

## 1. Mandatory Maintenance Workflow

For every future change:

1. Read this manual before editing.
2. Inspect the relevant module and its callers before changing signatures or state.
3. Make the smallest complete change that preserves existing behavior.
4. Update this manual whenever behavior, APIs, files, state fields, render paths, actions, persistence, or dependencies change.
5. Add or update tests only when the project gains test infrastructure or behavior needs focused verification.
6. Run syntax and dependency checks, and perform the smallest relevant browser verification.
7. Update the "Last updated" date and "Change Log" in this file.
8. Never describe the manual as updated unless this file and the corresponding project code are both committed/present in the worktree.

## 2. Project Overview

THE CARKOS CODEX is a browser-only ES module game using:

- `index.html` for DOM structure.
- `style.css` for layout and visual styling.
- `src/main.js` for application orchestration, animation, UI, input, export, and recording.
- `src/lore.js` as the static catalog/base data layer.
- `src/state.js` for mutable runtime state, inventory, progression, and local persistence.
- `src/shaders.js` for WebGL raymarching and 3D scene rendering.
- `src/dungeon.js` for procedural dungeon generation, the visited-floor cache, and room actions.
- `src/combat.js` for turn-based encounter logic and physical dice animation.
- `src/art2d.js` for public 2D drawing APIs and retained portraits/maps/covers.
- `src/assets/*.js` for extracted NPC, monster, item, and vessel drawings.
- `src/typography.js` for the bundled Cousine canvas stack and the ASCII shade-ramp presets.
- `fonts/` for the self-hosted Cousine faces and `fonts/OFL.txt`.

There is currently no package manifest or build step. Run the project through a local HTTP server so ES modules and canvas/browser APIs are available.

## 3. File Map

### `index.html`

Defines the top toolbar, main canvas, CRT overlay, title panel, character forge, game HUD, and Codex archive. The document head includes an inline empty icon so a static file server does not log a missing `favicon.ico`.

Important stable DOM groups:

- `#main-canvas`: final displayed rasterized canvas.
- `#mini-portrait`: miniature protagonist portrait.
- `#panel-title`, `#panel-forge`, `#panel-game`, `#panel-gallery`: mutually visible side panels.
- `#game-choices`: action buttons for world, dungeon, camp, town, and encounter interactions.
- `#inv-items`: stacked inventory buttons.
- `#btn-nav-map`, `#btn-nav-camp`: map/camp navigation.
- `#btn-gallery`, `#btn-audio`, `#btn-edges`, `#btn-merch`, `#btn-aspect`, `#btn-record`: archive and output controls.

Do not rename or remove DOM IDs used by `src/main.js` or `src/combat.js` without updating every reference and this manual.

### `style.css`

Controls the terminal-grimoire layout, toolbar, panels, HUD, inventory, buttons, vertical/reel mode, CRT overlay, and encounter styles.

The UI face is self-hosted Cousine (`fonts/`, SIL OFL in `fonts/OFL.txt`), declared with `@font-face` and used as `"Cousine", "Courier New", Courier, monospace`. CSS type sizes are 10px, 11.5px, and 17px. Toolbar buttons and the time pill use 10px so the longest phase name stays on one row; titles are 17px and reading text is 11.5px.

Key rules:

- `.hidden` removes an element from layout.
- `.main-frame.vertical-mode` switches to the 9:16-style layout.
- `.tool-btn.active` marks toggled toolbar features.
- Canvas and panels share the `.main-frame` layout.

### `src/lore.js`

Canonical static data module. It exports:

- `TIME_PHASES`
- `CLASSES`
- `OMENS`
- `PANTHEON`
- `ITEM_CATALOG`
- `GALLERY_LORE`
- `MAP_LOCATIONS`
- `QUESTS`
- `ENEMY_TEMPLATES`

Lore and catalog data should be added here rather than invented inside rendering or action modules. `MAP_LOCATIONS` coordinates are a static catalog. The Masked Peddler's roaming chart position is not stored on that entry; `drawWorldMap` writes it to `state.peddlerPos`, and map markers, labels, and hotspots read it back through `mapLocationPosition`.

### `src/state.js`

Runtime state and persistence module.

Core exports:

- `state`
- `fallingDice`
- `floatingTexts`
- `generateFaceParams`
- `spawnFloatText`
- inventory helpers: `addItem`, `removeItem`, `getItemQty`
- clock/stat/progression helpers: `advanceTime`, `getComputedStats`, `grantXP`
- persistence: `saveGame`, `hasSavedGame`, `loadGame`, `clearSave`
- deterministic PRNG: `mulberry32`
- world-map peddler position: `syncPeddlerPosition`, `mapLocationPosition`
- dungeon floor-cache key: `dungeonFloorKey`

`state.screen` values are:

- `title`
- `forge`
- `map`
- `town`
- `camp`
- `dungeon`
- `wild`
- `encounter`
- `gallery`

Important state groups include character selection, progression, health/shield, clock, inventory, curses, Pantheon brand, camp upgrades, dungeon data, the visited-floor cache, encounter data, the live peddler map position, pointer position, and transient animation queues.

The local-storage save key remains `carkos_codex_save_v9`. Save/load serialization explicitly lists fields. A newly persisted field requires updating `saveGame`, `loadGame`, and this manual. Missing fields on older saves must load without throwing.

Persisted additions in v9.2:

- `shield`. Absent on older saves, which load as `0`.
- `dungeonFloors`, the visited-floor cache. Absent on older saves, which load as `{}`. If that save still has a current `dungeon`, `loadGame` registers that floor in the cache under `dungeonFloorKey(id, depth)` and aliases `state.dungeon` to the cache entry.

`peddlerPos` is recomputed every world-map frame and is not written to the save.

### `src/main.js`

The application owner. It:

- Retrieves and initializes canvas contexts.
- Rasterizes low-resolution WebGL or 2D pixels into ASCII.
- Applies Sobel-style edge detection and 4x4 Bayer dithering.
- Runs the `requestAnimationFrame` loop.
- Routes the current screen to 2D or 3D rendering.
- Renders canvas overlays, hotspots, floating text, physical dice, and the mini portrait.
- Wires DOM events and callbacks.
- Builds transparent PNG exports and 8-second WebM recordings.
- Configures combat and dungeon callback hooks.
- Checks for and restores saved games.

The ASCII pipeline uses `COLS`, `ROWS`, `CELL_W`, `CELL_H`, and the ramp presets in `src/typography.js`. The display canvas is separate from the low-resolution buffer and WebGL readback canvas. The first frame waits on `document.fonts.ready` and an explicit bold Cousine load, raced against a 2 second cap, before `renderPixelsToAscii` runs.

Shade ramps, darkest to lightest. Coverage is mean alpha of Cousine Bold at 8px inside a 6×8 cell:

- `density` (default): `" .:;*+=#%@"` (10 glyphs). Mean alpha rises from 0 through . 0.025, : 0.050, ; 0.075, * 0.094, + 0.141, = 0.154, # 0.208, % 0.258, @ 0.287.
- `legacy`: the lettered ramp shipped before this pass, including its terminal `█`. No separate hotspot rule.
- `punct`: `" .:~*=+#%@"`.
- `blocks`: the first density string `" .·:;+#%@░▒"`. Mean alpha is not monotone: ░ is 0.143 and ▒ is 0.262, while @ is 0.287, so the block tiers flatten bright areas.

On `density`, `punct`, and `blocks`, a non-edge cell draws `█` only when source luminance is at least `0.97`. The cover mitre stroke is `#fbf8f3` (about 0.974) so its tips still clear that gate. `]` and `[` cycle the four presets unless the event target is an `input` or `textarea`. `?ramp=legacy|density|punct|blocks` (or `0|1|2|3`) selects one. A `RAMP <id>` label is drawn only after the query param or a cycle key is used. Sobel edges and the 4×4 Bayer matrix are unchanged.

### `src/typography.js`

Leaf module. Exports `FONT_STACK`, `canvasFont`, the four ramp presets (`legacy`, `density`, `punct`, `blocks`), `DEFAULT_RAMP_ID`, `HOTSPOT_LUM` (`0.97`), and `RAMP_SEPARATION` (`0.2`, two steps of the 10-glyph ramps). It does not import.

### `src/shaders.js`

Contains the WebGL vertex/fragment shaders and signed-distance-function prefabs.

Uniforms include:

- resolution
- time
- mouse/pointer
- environment code
- Pantheon color
- prop type
- prop state
- time phase
- gear ID

Environment codes:

- `0`: Miregate town
- `1`: dungeon room
- `2`: dungeon well
- `3`: Quicksilver Fen
- `4`: surface camp
- `5`: dungeon camp
- `6`: cinematic combat

Prop state encodes context-specific values such as camp upgrades, room clearing, boss room state, or chest/well state. Keep shader and `main.js`/dungeon mappings synchronized.

### `src/art2d.js`

Public 2D API. These exports must remain stable unless every caller is intentionally updated:

- `drawDetailedArtwork(ctx, w, h, artId, t)`
- `drawWorldMap(ctx, w, h, t)`
- `drawExpressivePortrait(ctx, w, h, t)`
- `drawCoverArt(ctx, w, h, t)`
- `drawFullBodyVessel(ctx, w, h, t)`

`drawDetailedArtwork` delegates in this order:

1. `drawNpcPlate`
2. `drawMonsterPlate`
3. `drawItemPlate`

`drawFullBodyVessel` retains the Pantheon backdrop and framed portrait inset and delegates only the class body to `drawVesselClassBody`.

### `src/assets/npcs.js`

Exports `drawNpcPlate(ctx, artId, t, godRgb)` and handles sentinel, priest, frogknight, nighthag, fenwarden, peddler, and hermit.

### `src/assets/monsters.js`

Exports `drawMonsterPlate(ctx, artId, t, godRgb)` and handles exile, mirevisage, and marionette.

### `src/assets/items.js`

Exports `drawItemPlate(ctx, artId, t, godRgb)` and handles censer, shard, moss, reedbone, ration, and torch.

### `src/assets/vessels.js`

Exports `drawVesselClassBody(ctx, clsKey, palette, t, wpnTier)` and handles penitent, fendiver, flagellant, scavenger, cantor, and rootwalker.

## 4. Dependency Graph

Keep the module graph explicit and one-directional where specified:

```text
index.html
  -> src/main.js
       -> src/lore.js
       -> src/state.js -> src/lore.js
       -> src/typography.js
       -> src/shaders.js -> src/lore.js, src/state.js
       -> src/art2d.js -> src/lore.js, src/state.js, src/typography.js, src/assets/*.js
       -> src/dungeon.js -> src/state.js, src/typography.js
       -> src/combat.js -> src/lore.js, src/state.js, src/typography.js

src/typography.js
  -> no imports

src/assets/*.js
  -> no imports; receive lore-derived values and state-derived values as arguments
```

Asset modules must not import and must not create circular dependencies. Use explicit relative `.js` extensions in ES module imports.

Current strict graph exception:

- `src/assets/vessels.js` may accept `drawExpressivePortrait` as a callback or use no import.

The intended extraction is:

- lore/static data: `lore.js`
- mutable gameplay state: `state.js`
- renderer orchestration: `main.js`
- sub-systems: `shaders.js`, `dungeon.js`, `combat.js`
- artwork: `art2d.js` and `assets/*.js`

## 5. Rendering Pipeline

Every animation frame increments `state.time` and decays `state.combatPulse`, then:

1. Route from `state.screen` and `state.viewArtId`.
2. For 2D scenes, draw to the low-resolution 2D buffer and rasterize to ASCII.
3. For 3D scenes, render WebGL into low-resolution RGBA pixels and rasterize to ASCII.
4. Render the expressive mini portrait independently.
5. Draw hotspots, map labels, minimap, floating text, and physical dice as 2D overlays.
6. Schedule the next frame with `requestAnimationFrame`.

Screen routing is primarily in `loop()` in `src/main.js`.

For 2D:

- title -> `drawCoverArt`
- forge -> `drawFullBodyVessel`
- gallery/art inspection -> `drawDetailedArtwork`
- map -> `drawWorldMap`
- inspected vessel -> `drawFullBodyVessel`

For 3D:

- town -> environment `0`
- dungeon -> environment `1` or `2`
- wild/fen -> environment `3`
- camp -> environment `4` or `5`
- encounter -> environment `6`

Refactors that are not an approved art pass still require preserving every coordinate, gradient, color, branch, formula, and call sequence. Drawing time must remain passed through as `t` and use the original animation formulas.

An owner-approved art pull request may change pixels. The shipped picture stays a dithered glyph-pixel raster (Cousine glyphs in the low-resolution grid), not literal ASCII, unless the owner asks otherwise. Plate, cover, and world-map strokes that are glyph-rasterized are kept at 2px or thicker. The map change is line width only: border, mountains, fen ripples, and pilgrim roads. Post-ASCII overlay strokes (hotspot frames, the dungeon chart) are vector and are not part of that 2px floor. The forge patron wash center stop is alpha `0.30`. Vessel `clothDark`, `clothMid`, and `parchment` are lifted, when needed, until their luminance is at least `RAMP_SEPARATION` (two steps of the shortest ramp) above that wash.

## 6. State and Progression

Character choices come from `CLASSES`, `OMENS`, and `PANTHEON`.

Computed stats:

- begin with the selected class base
- add one omen bonus
- add `state.statBoosts`

Experience and leveling are handled by `grantXP`:

- XP increases `state.xp`.
- reaching `state.nextXp` increases level, recalculates the next threshold, increases maximum HP, restores HP, and increments `pendingLevelUps`.

Inventory is stacked by item name through `addItem` and `removeItem`.

The clock advances in `TIME_PHASES` and wraps to the next day.

Torch use, curses, brand level, camp upgrades, weapon tier, and shield are gameplay state. Shield is included in the save payload. The live peddler chart position is intentionally excluded because it is a function of animation time.

## 7. Time, World, and Screen Flow

Main navigation:

- title -> forge
- forge -> world map
- map -> town, dungeon, or wild based on location
- camp -> town/rest/sharpen/ritual choices
- dungeon -> dungeon rooms and encounters
- encounter -> victory or continuing encounter
- gallery -> previous play screen

The world map hotspots are defined from `MAP_LOCATIONS`, except the Masked Peddler, whose `x`/`y` come from `state.peddlerPos` so the hit target follows the lantern. Town hotspots are tavern, shrine, and smith. Camp hotspots are hearth, anvil, and totem. Fen hotspots are the Fen-Warden and Mire-Leviathan.

Dungeon access is blocked by the map navigation guard while in a dungeon, encounter within a dungeon, or dungeon camp.

## 8. Dungeon System

`generateDungeon(dungeonId, depth)` starts a new expedition from the world map:

- clears that dungeon's visited-floor cache
- builds a fresh floor (see the cache miss path below)
- stores it on `state.dungeon`
- places the player on the entrance stairs

Floor cache:

- Storage is `state.dungeonFloors`. The key is `dungeonFloorKey(dungeonId, depth)` from `src/state.js` (`"${dungeonId}:${depth}"`).
- `getDungeonFloor(dungeonId, depth)` returns the cached floor or, on a miss, stores `buildDungeonFloor(dungeonId, depth, dungeonFloorSeed(dungeonId, depth))`.
- `state.dungeon` is the same object as the cache entry for the current floor. Room clears, visits, and reveals mutate that object, so the cache stays current without a separate snapshot step.
- Ascending (`dng-ascend-level`) restores the previous depth and places the player on that floor's descending stairs: the cleared boss room. If that room is not a cleared boss, the player is placed on the entrance instead.
- Descending (`dng-descend-level`) restores a deeper floor already in the cache, or builds one on a miss, and places the player on that floor's entrance stairs.
- Leaving by the surface stairs (`exit-dungeon-surface`) drops that dungeon's cache. Traveling in from the map calls `generateDungeon`, which also drops it, so a new expedition still starts on a fresh depth-1 floor. Beginning a new pilgrimage clears the whole cache.
- The cache is part of the save (see persistence above). A reload mid-delve restores every visited floor. A save written before `dungeonFloors` existed restores only the current floor and treats other depths as cache misses.

`buildDungeonFloor(dungeonId, depth, floorSeed)` is the plug-in point for a later pure generator of `(dungeonId, depth, floorSeed)`. It must keep that signature. The current body is the historical `Math.random` walk and does not mix `floorSeed` into the layout; `dungeonFloorSeed` still returns a stable unsigned hash so the cache can pass a seed today. Replacing the body with a pure function does not require changes to `getDungeonFloor`, ascend, or descend.

The historical builder:

- creates a 5x5 bounded room graph
- creates eight or more non-secret rooms
- adds an adjacent secret vault near a painting room
- adds a floor boss sanctum
- marks entrance neighbors as revealed
- returns the floor object (it does not itself assign `state.dungeon` or change the screen)

Dungeon room fields include:

- `id`
- grid coordinates `gx`/`gy`
- `type`
- `label`
- `isSecret`
- `connections`
- `visited`
- `revealed`
- `cleared`

Room types include entrance, combat, painting, treasure, puzzle, wandering, trap, well, and boss.

Movement consumes a step and every fourth step advances time. It also burns torch time where relevant.

Use `getDungeonRenderParams()` to keep room visualization synchronized with the WebGL environment/prop mapping. Use `renderDungeonRoom()` to rebuild narrative and choices. Use `handleDungeonAction(action)` for actions whose IDs begin with `dng-`, exit, and dungeon-specific interactions.

## 9. Combat System

Combat state is stored in `state.encounter` and contains the template fields plus:

- `isBoss`
- `maxHp`
- `hp`
- `stateLabel`
- `turnIdx`
- `bleedTurns`
- `stunned`

The player combat choices are strike, patron miracle, parley, and guard.

Checks use a d20 plus computed stat/darkness modifiers. Dark rooms apply `-3` when `state.torchTurns === 0`.

The physical dice are transient objects in `fallingDice`. Their settlement callback executes the combat result. Preserve callback sequencing and `state.diceRolling` guards when changing combat flow.

Victory and defeat must update encounter state, XP, loot, curses, health, and saved state consistently.

## 10. Callback Architecture

`dungeon.js` and `combat.js` do not directly import `main.js`. `main.js` registers callback hooks once through:

- `configureDungeon(callbacks)`
- `configureCombat(callbacks)`

Dungeon hooks include dialogue, HUD, time HUD, navigation, dice, encounter start, and world map.

Combat hooks include dialogue, HUD, navigation, and sound.

When adding an action that calls a `main.js` function, prefer registering or extending callbacks instead of adding a `main.js` import cycle.

## 11. UI and Action Conventions

DOM event delegation is used for dynamic choice and inventory elements.

Actions use string IDs:

- `travel-*`
- `town-*`
- `camp-*`
- `fen-*`
- `dng-*`
- `enc-*`

Dynamic choice buttons carry `data-action`. Inventory buttons carry `data-item`.

Before adding a handler:

1. Decide whether it belongs in `main.js`, `dungeon.js`, or `combat.js`.
2. Add it to `handleAction` or the appropriate module handler.
3. Ensure dice rolling, dark penalties, and view-art states are respected.
4. Update `updateHUD`, `updateTimeHUD`, `updateNavButtons`, and persistence as needed.
5. Add matching DOM elements/data attributes if required.
6. Update this manual.

## 12. Audio and Toolbar Features

The project uses Web Audio through functions in `main.js`.

Toolbar features:

- gallery/archive
- audio toggle
- Sobel edge toggle
- 3x transparent PNG export
- 9:16/reel mode
- 8-second WebM recording

PNG export rasterizes at 3x the ASCII canvas resolution. 3D exports use WebGL readback pixels; 2D exports use the 2D buffer.

Recording captures `mainCanvas` at 60 FPS in VP9 when supported, otherwise standard WebM.

## 13. Adding or Changing a System

### Adding lore/static entities

Update `src/lore.js`, connect an existing state or action, update relevant `GALLERY_LORE` or item catalog entries, and update the manual.

### Adding an inventory item

Add its catalog entry in `lore.js`, add its `artId` handling to `src/assets/items.js` if gallery drawing is needed, add inventory/action handling in `state.js` or `main.js`, and update save/load behavior if needed.

### Adding a class

Update `CLASSES`, `src/assets/vessels.js`, the flesh-forge DOM in `index.html`, the forge event wiring in `main.js`, and shader gear mapping if the 3D silhouette changes.

### Adding a location

Update `MAP_LOCATIONS`, main map/click routing, scene hotspots, WebGL environment/prop mapping if applicable, and this manual.

### Adding dungeon content

Update room pools/names, room rendering, `getDungeonRenderParams`, and `handleDungeonAction`. Preserve room graph invariants and secret/boss placement. New floors go through `buildDungeonFloor`; do not bypass `getDungeonFloor` on ascend or descend, or visited floors will be regenerated.

### Adding combat entities

Update `ENEMY_TEMPLATES`, combat prop mappings, WebGL monster rendering if needed, encounter text/telegraphs, and this manual.

### Changing visual output

Preserve coordinates, colors, and formulas unless the owner has approved that art pass or the task explicitly requests a visual change. Approved art passes keep the dithered glyph-pixel look. For 2D refactors, retain the public API and original context state, transform, and restoration behavior. New UI greens for heal/ok text use `#7da882` (replacing `#82d988`). Canvas overlay text is at least 10.5px.

## 14. Frozen/Protected Files

Unless a task explicitly authorizes it, preserve public and behavior contracts in:

- `index.html`
- `style.css`
- `src/main.js`
- `src/shaders.js`
- `src/combat.js`
- `src/dungeon.js`
- `src/lore.js`
- `src/state.js`

Protected does not mean uneditable. It means changes require a complete dependency/caller review and manual updates.

## 15. Verification Checklist

Before completing a change:

- [ ] Inspect all direct importers and direct state/data consumers.
- [ ] Verify ES module paths include `.js`.
- [ ] Verify no asset module imports or circular dependencies were introduced.
- [ ] Run `node --check` on every changed JavaScript file.
- [ ] Verify public function names and signatures remain stable unless intentionally changed.
- [ ] Verify HTML IDs and `data-*` attributes match JS selectors.
- [ ] Verify state save/load fields stay synchronized.
- [ ] Verify action IDs and callback hooks are handled.
- [ ] Verify animation formulas and transform state if artwork changed.
- [ ] Verify the smallest relevant browser flow:
  - title
  - forge
  - world map
  - one town/camp/fen route
  - one dungeon room
  - one encounter
  - gallery/export control
- [ ] Update this manual.

Because the project has no build configuration in the current repository, syntax verification is the default minimum. Browser testing should be done through a local HTTP server.

## 16. Change Log

### 2026-11-26 — Merge art pass with v9.2 continuity

- Merged `origin/main` (the approved art pass) into the continuity branch. Cousine, the typography ramps, `HOTSPOT_LUM` 0.97, 2px glyph and world-map strokes, `#7da882`, and the floor cache, shield persistence, peddler chart position, and v9.2 labels all remain.

### 2026-11-25 — v9.2 continuity

- Aligned the visible version with the V9.2 source revision. The `index.html` document title and toolbar wordmark, and this manual, now read v9.2. An inline empty icon in `index.html` stops the browser from requesting a missing `favicon.ico`.
- `saveGame` / `loadGame` persist `state.shield` on the existing `carkos_codex_save_v9` key. Older saves that omit `shield` load with shield `0`.
- Moved the Masked Peddler's roaming chart position from `MAP_LOCATIONS` onto `state.peddlerPos`. Catalog coordinates stay fixed. Markers, labels, and hotspots share `mapLocationPosition`, using the same `0.58 + sin(t * 0.4) * 0.06` / `0.69 + cos(t * 0.4) * 0.03` formula as before. The position is not saved.
- Added a dungeon floor cache keyed by dungeon id and depth. Ascending restores the previous floor and arrives on its descending stairs. Descending into an already visited deeper floor restores that floor and arrives on its entrance stairs. Visited floors persist in the save for the active delve and stay backward compatible when the field is missing. Surface exit and a new map expedition still discard that dungeon's cache so re-entry generates a fresh floor. `buildDungeonFloor(dungeonId, depth, floorSeed)` is the seam for a later pure seeded generator.

### 2026-11-25 — Approved art pass (dithered glyph-pixel)

- Owner approval for this pass overrides the zero-pixel default. The picture stays dithered Cousine glyphs, not literal ASCII.
- Bundled Cousine Regular, Bold, and Italic as WOFF2 under `fonts/` with `fonts/OFL.txt`. CSS and every canvas `font` use it. The animation loop starts after `document.fonts.ready`, capped at 2 seconds with `Promise.race`.
- Shade ramps live in `src/typography.js`. Default is `" .:;*+=#%@"` ordered by mean alpha, not by an alpha>16 pixel count. The previous block string is the `blocks` preset. `█` is reserved for non-edge cells at source luminance `>= 0.97` on `density`, `punct`, and `blocks`. The cover mitre stroke is `#fbf8f3` so those tips still qualify. `?ramp=` and the `[` / `]` keys cycle `legacy`, `density`, `punct`, and `blocks`. Bracket keys do not capture focus inside an input or textarea.
- Forge patron-glow center alpha is `0.30`. Vessel subject fills are lifted to stay at least two shortest-ramp steps above that glow.
- Glyph-rasterized plate, portrait, cover, and vessel strokes below 2px are now 2px. World-map border, mountain, fen, and road strokes are 2px as well. Line widths only.
- `#82d988` is now `#7da882`. The dungeon chart overlay is 10.5px. CSS type sizes are 10px, 11.5px, and 17px. Inventory item buttons inherit Cousine.

### 2026-11-25 — Ramp measurement correction

- Replaced the default ramp with `" .:;*+=#%@"` after a mean-alpha remeasure (░ 0.143, ▒ 0.262, @ 0.287). The old string is `blocks`.
- `HOTSPOT_LUM` returned to `0.97`. A gate of 0.92 spread `█` across lamps, windows, and map markers. The cover mitre stroke is `#fbf8f3` (luminance about 0.974) so the spike tips still draw `█`. Fonts are WOFF2 (Regular, Bold, Italic). Font load is raced against 2 seconds. `.inv-item` inherits the UI face. `[` / `]` ignore inputs and textareas.
- World-map strokes at 1.3–1.6px (border, Osscrown hatching, fen ripples, pilgrim roads) are 2px. Coordinates and colors are unchanged.

### 2026-11-25

- Created the project manual.
- Documented the refactor that moved detailed NPC, monster, item, and vessel 2D artwork into `src/assets/npcs.js`, `src/assets/monsters.js`, `src/assets/items.js`, and `src/assets/vessels.js`.
- Documented `src/art2d.js` as a thin public dispatcher for detailed plates and a full-body vessel scaffold.
- Documented the mandatory manual-update workflow for future edits.
