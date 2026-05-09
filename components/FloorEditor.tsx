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

function edgesToText(edges: FloorEdge[]): string {
  return edges
    .map((e) => `${e.from[0]},${e.from[1]} -> ${e.to[0]},${e.to[1]}`)
    .join('\n');
}

function parseEdges(text: string): { ok: FloorEdge[]; errors: string[] } {
  const ok: FloorEdge[] = [];
  const errors: string[] = [];
  text.split('\n').forEach((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    const m = trimmed.match(
      /^(\d+)\s*,\s*(\d+)\s*->\s*(\d+)\s*,\s*(\d+)$/,
    );
    if (!m) {
      errors.push(`line ${i + 1}: cannot parse "${trimmed}"`);
      return;
    }
    ok.push({
      from: [Number(m[1]), Number(m[2])],
      to: [Number(m[3]), Number(m[4])],
    });
  });
  return { ok, errors };
}

export default function FloorEditor({ iconDict }: FloorEditorProps) {
  const iconIds = useMemo(() => Object.keys(iconDict).sort(), [iconDict]);

  const [floorId, setFloorId] = useState('lab1_f1');
  const [name, setName] = useState('悖论迷宫: 第1区域');
  const [nodes, setNodes] = useState<Record<NodeKey, FloorNode>>(
    buildInitialNodes,
  );
  const [edgesText, setEdgesText] = useState('');
  const [status, setStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const { ok, errors } = parseEdges(edgesText);
    const sorted = Object.values(nodes).sort((a, b) =>
      a.row !== b.row ? a.row - b.row : a.col - b.col,
    );
    return {
      floor: {
        schema_version: 1,
        floor_id: floorId,
        name,
        grid: { cols: COLS, rows: ROWS },
        nodes: sorted,
        edges: ok,
      },
      errors,
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
        setEdgesText(edgesToText(data.edges ?? []));
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
    setEdgesText('');
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
          className="grid gap-2 mb-6"
          style={{
            gridTemplateColumns: `repeat(${COLS}, minmax(150px, 1fr))`,
          }}
        >
          {Array.from({ length: ROWS * COLS }, (_, idx) => {
            const r = Math.floor(idx / COLS);
            const c = idx % COLS;
            const node = nodes[cellKey(r, c)];
            const locked = c === MID_COL;
            const tiers = node ? tierKeys(iconDict, node.icon_id) : [];
            const hasFixedKey = node
              ? Boolean(iconDict[node.icon_id]?.icon['fixed'])
              : false;
            const resolved = node
              ? resolveIcon(iconDict, node.icon_id, node.tier)
              : null;
            return (
              <div
                key={`${r}_${c}`}
                className={`flex flex-col gap-1 p-2 rounded border ${
                  locked
                    ? 'border-amber-600 bg-stone-900/60'
                    : 'border-stone-700 bg-stone-900/30'
                }`}
              >
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
                    {hasFixedKey && <option value={EMPTY}>(默认 fixed)</option>}
                    {tiers.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-6">
        <label className="flex flex-col text-sm">
          <span className="mb-1">
            额外 edges（每行一条，格式 <code>r1,c1 -&gt; r2,c2</code>，
            同行相邻 / 中列相邻已默认连通）
          </span>
          <textarea
            value={edgesText}
            onChange={(e) => setEdgesText(e.target.value)}
            rows={5}
            className="px-2 py-1 bg-stone-800 border border-amber-700 rounded text-amber-100 font-mono text-xs"
            placeholder="3,1 -> 4,1"
          />
        </label>
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
