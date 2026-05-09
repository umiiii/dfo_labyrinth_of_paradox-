# Labyrinth Image to Floor JSON SOP

## Goal

Convert each source screenshot in `src/` into an editor-compatible `Floor` JSON file under `data/floors/`, then use the built-in editor at `/editor` to render/export an image and visually compare it with the source screenshot.

This SOP uses direct multimodal visual reading of the screenshots plus the browser editor. Do not use image-recognition scripts or template matching for the conversion step.

## Inputs

- Source screenshots: `src/演示文稿2_<n>.png`
- Existing calibration examples: `data/floors/lab1_f1_*.json`
- Editor: `http://127.0.0.1:3000/editor`
- Icon dictionary: `data/icons.json`

## Grid Contract

- The editor grid is always `cols: 7`, `rows: 5`.
- Coordinates are zero-based: top-left is `(row: 0, col: 0)`.
- The middle column is `col: 3`.
- Middle column nodes are locked in the editor:
  - row 0: `central_checkpoint_start`
  - rows 1-3: `central_checkpoint`
  - row 4: `central_checkpoint_last`
- Empty cells are omitted from JSON.

## Visual Icon Mapping

| Visual | JSON |
|---|---|
| Blue tower, top row | `central_checkpoint_start` |
| Blue tower, middle rows | `central_checkpoint` |
| Blue tower, bottom row | `central_checkpoint_last` |
| White scroll with gold star | `relic_excavation_zone` |
| Blue key magnifier | `labyrinth_supply_base`, tier `key` |
| Brown square magnifier | `labyrinth_supply_base`, tier `ticket` |
| Blue skull/diamond | `chaotic_radiance_pilgrimage` |
| Teal skull/diamond | `chaotic_life_pilgrimage` |
| Red/black triangular phenomenon | `dual_phenomenon` |
| Black/gold mask | `deviated_thousand_seas_sky` |
| Purple crystal pile | `tuner_left_trace`, tier `unique` |
| Purple crystal shard | `tuner_trace`, tier `unique` unless the source color clearly matches another tier |
| Cyan chest | `armament_warehouse`, tier `primeval` |
| Orange chest | `armament_warehouse`, tier `legendary` |
| Gold chest | `armament_warehouse`, tier `epic` |
| Purple chest with crossed tools | `giant_armament_warehouse`, tier `unique` |
| Orange chest with crossed tools | `giant_armament_warehouse`, tier `legendary` |

## Edge Rules

The app derives most edges automatically:

- Same-row adjacent declared nodes are connected automatically.
- Middle-column nodes at `col: 3` are connected vertically automatically.

Only add explicit `edges` for visible non-default connections, usually vertical cyan/yellow dotted links outside `col: 3`.

## Example: First Five Screenshots

The first five source screenshots are already represented by these JSON files:

| Source | Title in Image | JSON |
|---|---|---|
| `src/演示文稿2_68.png` | 第一层: 13322路线 | `data/floors/lab1_f1_13322.json` |
| `src/演示文稿2_69.png` | 第一层: 22113路线 | `data/floors/lab1_f1_22113.json` |
| `src/演示文稿2_70.png` | 第一层: 23132路线 | `data/floors/lab1_f1_23132.json` |
| `src/演示文稿2_71.png` | 第一层: 11221路线 | `data/floors/lab1_f1_11221.json` |
| `src/演示文稿2_72.png` | 第一层: 12321路线 | `data/floors/lab1_f1_12321.json` |

Use these five files to calibrate row/column placement, icon IDs, tier choices, and which non-default vertical edges should be recorded.

## Browser Editor QA

1. Start the app:
   ```sh
   node node_modules/next/dist/bin/next dev -H 127.0.0.1
   ```
2. Open `http://127.0.0.1:3000/editor` in the built-in browser.
3. Recreate or load the JSON in the editor.
4. Click `保存 JSON`; the editor downloads the JSON and saves a workspace copy to `data/floors/<floor_id>.json`.
5. Click `导出为图片`; the editor downloads the PNG and saves a workspace copy to `floor/<floor_id>.png`.
6. Compare the exported image against the source screenshot, ignoring:
   - red/yellow recommendation circles,
   - title overlays,
   - reward text labels,
   - left-side explanatory text.
7. Fix any mismatched node icon, tier, row/col, or explicit edge, then export again.

## Output Naming

Use:

```text
data/floors/lab1_f<layer>_<route>.json
```

For fourth-layer screenshots that are labeled only as route `1` to `5`, use:

```text
data/floors/lab1_f4_route<index>.json
```
