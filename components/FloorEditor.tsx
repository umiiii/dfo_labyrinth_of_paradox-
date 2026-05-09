'use client';

import { ChangeEvent, useMemo, useRef, useState } from 'react';
import type {
  Floor,
  FloorEdge,
  FloorNode,
  IconDict,
  NodeKey,
} from '@/types/labyrinth';
import { deriveEdges, resolveIcon } from '@/lib/floor-utils';

const ROWS = 5;
const COLS = 7;
const MID_COL = 3;
const EMPTY = '__empty__';

interface FloorEditorProps {
  iconDict: IconDict;
}

const cellKey = (r: number, c: number): NodeKey => `${r}_${c}` as NodeKey;

function defaultMidColIcon(row: number): string {
  if (row === 0) return 'central_checkpoint_start';
  if (row === ROWS - 1) return 'central_checkpoint_last';
  return 'central_checkpoint';
}

function buildInitialNodes(): Record<NodeKey, FloorNode> {
  const out: Record<NodeKey, FloorNode> = {};
  for (let r = 0; r < ROWS; r++) {
    out[cellKey(r, MID_COL)] = {
      row: r,
      col: MID_COL,
      icon_id: defaultMidColIcon(r),
    };
  }
  return out;
}

function tierKeys(iconDict: IconDict, iconId: string): string[] {
  const def = iconDict[iconId];
  if (!def) return [];
  return Object.keys(def.icon).filter((k) => !k.endsWith('_hover'));
}

function edgeKey(r1: number, c1: number, r2: number, c2: number): string {
  const a = `${r1}_${c1}`;
  const b = `${r2}_${c2}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function parseEdgeKey(key: string): [number, number, number, number] {
  const [a, b] = key.split('|');
  const [r1, c1] = a.split('_').map(Number);
  const [r2, c2] = b.split('_').map(Number);
  return [r1, c1, r2, c2];
}

export default function FloorEditor({ iconDict }: FloorEditorProps) {
  const iconIds = useMemo(() => Object.keys(iconDict).sort(), [iconDict]);

  const [floorId, setFloorId] = useState('lab1_f1');
  const [name, setName] = useState('悖论迷宫: 第1区域');
  const [nodes, setNodes] = useState<Record<NodeKey, FloorNode>>(
    buildInitialNodes,
  );
  const [extraEdges, setExtraEdges] = useState<Set<string>>(new Set());
  const [moveMode, setMoveMode] = useState(false);
  const [status, setStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const moveNode = (r: number, c: number, dr: number, dc: number) => {
    const nr = r + dr;
    const nc = c + dc;
    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return;
    const fromKey = cellKey(r, c);
    const toKey = cellKey(nr, nc);
    const cur = nodes[fromKey];
    if (!cur) return;
    if (nodes[toKey]) return;
    setNodes((prev) => {
      const next = { ...prev };
      delete next[fromKey];
      next[toKey] = { ...cur, row: nr, col: nc };
      return next;
    });
    setExtraEdges((prev) => {
      const next = new Set<string>();
      prev.forEach((k) => {
        const [r1, c1, r2, c2] = parseEdgeKey(k);
        if ((r1 === r && c1 === c) || (r2 === r && c2 === c)) return;
        next.add(k);
      });
      return next;
    });
  };

  const toggleEdge = (r1: number, c1: number, r2: number, c2: number) => {
    const key = edgeKey(r1, c1, r2, c2);
    setExtraEdges((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const setIcon = (r: number, c: number, iconId: string) => {
    if (c === MID_COL) return;
    const next = { ...nodes };
    const k = cellKey(r, c);
    if (iconId === EMPTY) {
      delete next[k];
    } else {
      const tiers = tierKeys(iconDict, iconId);
      const cur = next[k];
      const keepTier = cur && cur.icon_id === iconId ? cur.tier : undefined;
      const tier =
        keepTier && tiers.includes(keepTier)
          ? keepTier
          : tiers.length > 0 && !iconDict[iconId].icon['fixed']
            ? tiers[0]
            : undefined;
      next[k] = { row: r, col: c, icon_id: iconId, ...(tier ? { tier } : {}) };
    }
    setNodes(next);
  };

  const setTier = (r: number, c: number, tier: string) => {
    const k = cellKey(r, c);
    const cur = nodes[k];
    if (!cur) return;
    const next = { ...nodes };
    next[k] = { ...cur, ...(tier === EMPTY ? {} : { tier }) };
    if (tier === EMPTY) delete next[k].tier;
    setNodes(next);
  };

  const buildFloor = (): { floor: Floor; errors: string[] } => {
    const sorted = Object.values(nodes).sort((a, b) =>
      a.row !== b.row ? a.row - b.row : a.col - b.col,
    );
    const edges: FloorEdge[] = [];
    extraEdges.forEach((key) => {
      const [r1, c1, r2, c2] = parseEdgeKey(key);
      edges.push({ from: [r1, c1], to: [r2, c2] });
    });
    edges.sort((a, b) =>
      a.from[0] !== b.from[0]
        ? a.from[0] - b.from[0]
        : a.from[1] !== b.from[1]
          ? a.from[1] - b.from[1]
          : a.to[0] !== b.to[0]
            ? a.to[0] - b.to[0]
            : a.to[1] - b.to[1],
    );
    return {
      floor: {
        schema_version: 1,
        floor_id: floorId,
        name,
        grid: { cols: COLS, rows: ROWS },
        nodes: sorted,
        edges,
      },
      errors: [],
    };
  };

  const handleExportImage = async () => {
    const { floor, errors } = buildFloor();
    if (errors.length) {
      setStatus(`导出中止：${errors.join('; ')}`);
      return;
    }
    setStatus('生成图片中…');
    try {
      const blob = await renderFloorToPng(floor, iconDict);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${floor.floor_id}.png`;
      a.click();
      URL.revokeObjectURL(url);
      const form = new FormData();
      form.append('floor_id', floor.floor_id);
      form.append('image', blob, `${floor.floor_id}.png`);
      const res = await fetch('/api/editor-export/image', {
        method: 'POST',
        body: form,
      });
      if (!res.ok) throw new Error(await res.text());
      setStatus(`已下载并保存 ${floor.floor_id}.png`);
    } catch (err) {
      setStatus(`导出失败：${(err as Error).message}`);
    }
  };

  const handleSave = () => {
    const { floor, errors } = buildFloor();
    if (errors.length) {
      setStatus(`保存中止：${errors.join('; ')}`);
      return;
    }
    const blob = new Blob([JSON.stringify(floor, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${floor.floor_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    fetch('/api/editor-export/json', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(floor),
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(await res.text());
        setStatus(`已下载并保存 ${floor.floor_id}.json`);
      })
      .catch((err) => {
        setStatus(`保存失败：${(err as Error).message}`);
      });
  };

  const handleLoadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Floor;
        const map: Record<NodeKey, FloorNode> = {};
        data.nodes.forEach((n) => {
          map[cellKey(n.row, n.col)] = n;
        });
        for (let r = 0; r < ROWS; r++) {
          const k = cellKey(r, MID_COL);
          if (!map[k]) {
            map[k] = { row: r, col: MID_COL, icon_id: defaultMidColIcon(r) };
          }
        }
        setNodes(map);
        setFloorId(data.floor_id ?? 'untitled');
        setName(data.name ?? '');
        const nextEdges = new Set<string>();
        (data.edges ?? []).forEach((e) => {
          nextEdges.add(edgeKey(e.from[0], e.from[1], e.to[0], e.to[1]));
        });
        setExtraEdges(nextEdges);
        setStatus(`已加载 ${file.name}`);
      } catch (err) {
        setStatus(`解析失败：${(err as Error).message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClear = () => {
    setNodes(buildInitialNodes());
    setExtraEdges(new Set());
    setStatus('已重置（中列保留默认）');
  };

  return (
    <div className="mx-auto max-w-7xl p-6 text-amber-100">
      <h1 className="text-2xl font-bold mb-4">迷宫层编辑器</h1>

      <div className="flex flex-wrap gap-4 mb-4 items-end">
        <label className="flex flex-col text-sm">
          <span className="mb-1">floor_id</span>
          <input
            type="text"
            value={floorId}
            onChange={(e) => setFloorId(e.target.value)}
            className="px-2 py-1 bg-stone-800 border border-amber-700 rounded text-amber-100"
          />
        </label>
        <label className="flex flex-col text-sm flex-1 min-w-[280px]">
          <span className="mb-1">name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-2 py-1 bg-stone-800 border border-amber-700 rounded text-amber-100"
          />
        </label>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-3 py-1.5 bg-stone-800 border border-amber-700 rounded hover:bg-stone-700"
        >
          读取 JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={handleLoadFile}
        />
        <button
          type="button"
          onClick={handleSave}
          className="px-3 py-1.5 bg-amber-700 border border-amber-500 rounded hover:bg-amber-600"
        >
          保存 JSON
        </button>
        <button
          type="button"
          onClick={handleExportImage}
          className="px-3 py-1.5 bg-amber-700 border border-amber-500 rounded hover:bg-amber-600"
        >
          导出为图片
        </button>
        <button
          type="button"
          onClick={() => setMoveMode((v) => !v)}
          aria-pressed={moveMode}
          className={`px-3 py-1.5 border rounded ${
            moveMode
              ? 'bg-amber-700 border-amber-500 hover:bg-amber-600'
              : 'bg-stone-800 border-stone-600 hover:bg-stone-700'
          }`}
        >
          {moveMode ? '退出移动模式' : '移动模式'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-3 py-1.5 bg-stone-800 border border-stone-600 rounded hover:bg-stone-700"
        >
          清空
        </button>
      </div>

      {status && (
        <div className="mb-3 text-sm text-amber-300">{status}</div>
      )}

      <div className="overflow-x-auto">
        <div
          className="grid mb-6"
          style={{
            gridTemplateColumns: Array.from(
              { length: 2 * COLS - 1 },
              (_, i) => (i % 2 === 0 ? 'minmax(150px, 1fr)' : '28px'),
            ).join(' '),
            gridTemplateRows: Array.from(
              { length: 2 * ROWS - 1 },
              (_, i) => (i % 2 === 0 ? 'auto' : '28px'),
            ).join(' '),
          }}
        >
          {Array.from(
            { length: (2 * ROWS - 1) * (2 * COLS - 1) },
            (_, idx) => {
              const gr = Math.floor(idx / (2 * COLS - 1));
              const gc = idx % (2 * COLS - 1);
              const isNodeRow = gr % 2 === 0;
              const isNodeCol = gc % 2 === 0;

              if (isNodeRow && isNodeCol) {
                const r = gr / 2;
                const c = gc / 2;
                const node = nodes[cellKey(r, c)];
                const locked = c === MID_COL;
                const tiers = node ? tierKeys(iconDict, node.icon_id) : [];
                const hasFixedKey = node
                  ? Boolean(iconDict[node.icon_id]?.icon['fixed'])
                  : false;
                const resolved = node
                  ? resolveIcon(iconDict, node.icon_id, node.tier)
                  : null;
                const canMove = (dr: number, dc: number) => {
                  if (!node) return false;
                  const nr = r + dr;
                  const nc = c + dc;
                  if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) return false;
                  return !nodes[cellKey(nr, nc)];
                };
                return (
                  <div
                    key={`n_${r}_${c}`}
                    className={`relative flex flex-col gap-1 p-2 rounded border ${
                      locked
                        ? 'border-amber-600 bg-stone-900/60'
                        : 'border-stone-700 bg-stone-900/30'
                    }`}
                  >
                    {moveMode && node && (
                      <>
                        <button
                          type="button"
                          disabled={!canMove(-1, 0)}
                          onClick={() => moveNode(r, c, -1, 0)}
                          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 px-1.5 py-0 text-xs leading-none bg-amber-700 border border-amber-500 rounded hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-amber-700"
                          aria-label="move up"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          disabled={!canMove(1, 0)}
                          onClick={() => moveNode(r, c, 1, 0)}
                          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 px-1.5 py-0 text-xs leading-none bg-amber-700 border border-amber-500 rounded hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-amber-700"
                          aria-label="move down"
                        >
                          ↓
                        </button>
                        <button
                          type="button"
                          disabled={!canMove(0, -1)}
                          onClick={() => moveNode(r, c, 0, -1)}
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 px-1.5 py-0 text-xs leading-none bg-amber-700 border border-amber-500 rounded hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-amber-700"
                          aria-label="move left"
                        >
                          ←
                        </button>
                        <button
                          type="button"
                          disabled={!canMove(0, 1)}
                          onClick={() => moveNode(r, c, 0, 1)}
                          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 px-1.5 py-0 text-xs leading-none bg-amber-700 border border-amber-500 rounded hover:bg-amber-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-amber-700"
                          aria-label="move right"
                        >
                          →
                        </button>
                      </>
                    )}
                    <div className="text-[10px] text-stone-400">
                      ({r},{c}){locked ? ' · 锁定' : ''}
                    </div>
                    <div className="flex items-center justify-center h-12">
                      {resolved ? (
                        <img
                          src={resolved.fixed}
                          alt={node?.icon_id}
                          className="h-12 w-12 object-contain"
                        />
                      ) : (
                        <span className="text-stone-600 text-xs">空</span>
                      )}
                    </div>
                    <select
                      disabled={locked}
                      value={node?.icon_id ?? EMPTY}
                      onChange={(e) => setIcon(r, c, e.target.value)}
                      className="text-xs bg-stone-800 border border-stone-700 rounded px-1 py-0.5 disabled:opacity-60"
                    >
                      <option value={EMPTY}>(空)</option>
                      {iconIds.map((id) => (
                        <option key={id} value={id}>
                          {id}
                        </option>
                      ))}
                    </select>
                    {node && tiers.length > 0 && (
                      <select
                        disabled={locked}
                        value={node.tier ?? EMPTY}
                        onChange={(e) => setTier(r, c, e.target.value)}
                        className="text-xs bg-stone-800 border border-stone-700 rounded px-1 py-0.5 disabled:opacity-60"
                      >
                        {hasFixedKey && (
                          <option value={EMPTY}>(默认 fixed)</option>
                        )}
                        {tiers.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              }

              if (isNodeRow && !isNodeCol) {
                const r = gr / 2;
                const c = (gc - 1) / 2;
                const a = nodes[cellKey(r, c)];
                const b = nodes[cellKey(r, c + 1)];
                if (!a || !b) {
                  return <div key={`h_${r}_${c}`} />;
                }
                return (
                  <div
                    key={`h_${r}_${c}`}
                    className="flex items-center justify-center"
                  >
                    <div className="h-1 w-full rounded bg-amber-400" />
                  </div>
                );
              }

              if (!isNodeRow && isNodeCol) {
                const r = (gr - 1) / 2;
                const c = gc / 2;
                const a = nodes[cellKey(r, c)];
                const b = nodes[cellKey(r + 1, c)];
                if (!a || !b) {
                  return <div key={`v_${r}_${c}`} />;
                }
                if (c === MID_COL) {
                  return (
                    <div
                      key={`v_${r}_${c}`}
                      className="flex items-center justify-center"
                    >
                      <div className="w-1 h-full rounded bg-amber-400" />
                    </div>
                  );
                }
                const key = edgeKey(r, c, r + 1, c);
                const active = extraEdges.has(key);
                return (
                  <button
                    key={`v_${r}_${c}`}
                    type="button"
                    onClick={() => toggleEdge(r, c, r + 1, c)}
                    className="flex items-center justify-center group"
                    aria-label={`toggle edge (${r},${c})↔(${r + 1},${c})`}
                  >
                    <div
                      className={`w-1 h-full rounded transition ${
                        active
                          ? 'bg-amber-400'
                          : 'bg-stone-600 group-hover:bg-amber-200'
                      }`}
                    />
                  </button>
                );
              }

              return <div key={`x_${gr}_${gc}`} />;
            },
          )}
        </div>
      </div>
    </div>
  );
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load ${src}`));
    img.src = src;
  });
}

async function renderFloorToPng(
  floor: Floor,
  iconDict: IconDict,
): Promise<Blob> {
  const W = 1600;
  const H = 900;
  const PADDING_X_PCT = 24;
  const PADDING_Y_PCT = 16;
  const NODE_SIZE = 130;

  const cols = Math.max(1, floor.grid.cols - 1);
  const rows = Math.max(1, floor.grid.rows - 1);

  const xPx = (col: number) =>
    (W * (PADDING_X_PCT + ((100 - 2 * PADDING_X_PCT) * col) / cols)) / 100;
  const yPx = (row: number) =>
    (H * (PADDING_Y_PCT + ((100 - 2 * PADDING_Y_PCT) * row) / rows)) / 100;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');

  const parchment = await loadImage('/resources/map.img/0.PNG');
  ctx.drawImage(parchment, 0, 0, W, H);

  const derived = deriveEdges(floor);
  ctx.strokeStyle = '#f3c14b';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 8]);
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.95;
  for (const e of derived) {
    const [r1, c1] = e.from.split('_').map(Number);
    const [r2, c2] = e.to.split('_').map(Number);
    ctx.beginPath();
    ctx.moveTo(xPx(c1), yPx(r1));
    ctx.lineTo(xPx(c2), yPx(r2));
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  const sources = Array.from(
    new Set(
      floor.nodes.map(
        (n) => resolveIcon(iconDict, n.icon_id, n.tier).fixed,
      ),
    ),
  );
  const cache = new Map<string, HTMLImageElement>();
  await Promise.all(
    sources.map(async (src) => {
      cache.set(src, await loadImage(src));
    }),
  );

  for (const node of floor.nodes) {
    const { fixed } = resolveIcon(iconDict, node.icon_id, node.tier);
    const img = cache.get(fixed);
    if (!img) continue;
    const x = xPx(node.col) - NODE_SIZE / 2;
    const y = yPx(node.row) - NODE_SIZE / 2;
    ctx.drawImage(img, x, y, NODE_SIZE, NODE_SIZE);
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('canvas.toBlob returned null'));
    }, 'image/png');
  });
}
