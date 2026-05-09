'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Floor,
  IconDict,
  DerivedEdge,
  NodeKey,
} from '@/types/labyrinth';
import { deriveEdges, resolveIcon } from '@/lib/floor-utils';
import MazeNode from './MazeNode';

interface LabyrinthBoardProps {
  floor: Floor;
  iconDict: IconDict;
}

export default function LabyrinthBoard({
  floor,
  iconDict,
}: LabyrinthBoardProps) {
  const { grid, nodes } = floor;
  const cols = Math.max(1, grid.cols - 1);
  const rows = Math.max(1, grid.rows - 1);

  const PADDING_X = 24;
  const PADDING_Y = 16;

  const xPct = (col: number) =>
    PADDING_X + ((100 - 2 * PADDING_X) * (col / cols));
  const yPct = (row: number) =>
    PADDING_Y + ((100 - 2 * PADDING_Y) * (row / rows));

  const nodeByKey = useMemo(() => {
    const m = new Map<NodeKey, (typeof nodes)[number]>();
    for (const n of nodes) m.set(`${n.row}_${n.col}` as NodeKey, n);
    return m;
  }, [nodes]);

  const derivedEdges: DerivedEdge[] = useMemo(
    () => deriveEdges(floor),
    [floor],
  );

  const boardRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 480 });

  useEffect(() => {
    const el = boardRef.current;
    if (!el) return;
    const update = () => {
      setSize({ w: el.offsetWidth, h: el.offsetHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, []);

  const xPx = (col: number) => (xPct(col) / 100) * size.w;
  const yPx = (row: number) => (yPct(row) / 100) * size.h;

  return (
    <div
      ref={boardRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        backgroundImage: 'url(/resources/map.img/0.PNG)',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        containerType: 'size',
      }}
    >
      <svg
        className="absolute inset-0 pointer-events-none"
        width={size.w}
        height={size.h}
        viewBox={`0 0 ${size.w} ${size.h}`}
        style={{ zIndex: 1 }}
      >
        {derivedEdges.map((e, i) => {
          const a = nodeByKey.get(e.from);
          const b = nodeByKey.get(e.to);
          if (!a || !b) return null;
          return (
            <line
              key={`${e.from}->${e.to}-${i}`}
              x1={xPx(a.col)}
              y1={yPx(a.row)}
              x2={xPx(b.col)}
              y2={yPx(b.row)}
              stroke="#f3c14b"
              strokeDasharray="6 4"
              strokeWidth={3}
              strokeLinecap="round"
              opacity={0.95}
            />
          );
        })}
      </svg>

      <div className="absolute inset-0" style={{ zIndex: 2 }}>
        {nodes.map((n) => {
          const def = iconDict[n.icon_id];
          const resolved = resolveIcon(iconDict, n.icon_id, n.tier);
          return (
            <div
              key={`${n.row}_${n.col}`}
              className="absolute"
              style={{
                left: `${xPct(n.col)}%`,
                top: `${yPct(n.row)}%`,
                transform: 'translate(-50%, -50%)',
                width: 'min(114px, 14.25cqw, 17cqh)',
                aspectRatio: '1 / 1',
              }}
            >
              <MazeNode node={n} iconDef={def} resolved={resolved} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
