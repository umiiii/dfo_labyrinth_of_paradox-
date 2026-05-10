'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type {
  FloorNode,
  IconDef,
  ResolvedIcon,
  RewardItem,
} from '@/types/labyrinth';
import { resolveRewards } from '@/lib/floor-utils';

interface MazeNodeProps {
  node: FloorNode;
  iconDef: IconDef | undefined;
  resolved: ResolvedIcon;
}

export default function MazeNode({
  node,
  iconDef,
  resolved,
}: MazeNodeProps) {
  const label = iconDef?.name ?? node.icon_id;

  const [hover, setHover] = useState(false);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <div
      className="group relative flex items-center justify-center w-full h-full"
      data-row={node.row}
      data-col={node.col}
      data-icon-id={node.icon_id}
      data-tier={node.tier ?? 'fixed'}
      onMouseEnter={(e) => {
        setMouse({ x: e.clientX, y: e.clientY });
        setHover(true);
      }}
      onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}
      onMouseLeave={() => setHover(false)}
    >
      <img
        src={resolved.fixed}
        alt={label}
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none transition-opacity duration-150 group-hover:opacity-0"
      />
      <img
        src={resolved.hover}
        alt=""
        aria-hidden
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain select-none pointer-events-none opacity-0 transition-opacity duration-150 group-hover:opacity-100"
      />
      {mounted && hover && iconDef &&
        createPortal(
          <NodeTooltip
            name={iconDef.name}
            description={iconDef.description}
            rewards={resolveRewards(node.rewards ?? iconDef.rewards, node.tier)}
            x={mouse.x}
            y={mouse.y}
          />,
          document.body,
        )}
    </div>
  );
}

interface NodeTooltipProps {
  name: string;
  description: string;
  rewards?: RewardItem[];
  x: number;
  y: number;
}

function NodeTooltip({ name, description, rewards, x, y }: NodeTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number }>({
    left: x + 18,
    top: y + 18,
  });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const margin = 8;
    let left = x + 18;
    let top = y + 18;
    if (left + rect.width > window.innerWidth - margin) {
      left = x - rect.width - 18;
    }
    if (left < margin) left = margin;
    if (top + rect.height > window.innerHeight - margin) {
      top = y - rect.height - 18;
    }
    if (top < margin) top = margin;
    setPos({ left, top });
  }, [x, y, name, description, rewards]);

  return (
    <div
      ref={ref}
      className="fixed z-[10000] pointer-events-none"
      style={{
        left: pos.left,
        top: pos.top,
        width: 320,
      }}
    >
      <div
        className="shadow-2xl"
        style={{
          background: 'rgba(8, 8, 10, 0.94)',
          border: '1px solid rgba(90, 75, 50, 0.75)',
          boxShadow:
            '0 8px 24px rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(0, 0, 0, 0.4)',
        }}
      >
        <div
          className="px-4 pt-3 pb-2 text-lg font-semibold leading-snug"
          style={{
            color: '#f3c14b',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.7)',
            letterSpacing: '0.02em',
          }}
        >
          {name}
        </div>
        <div
          className="mx-3"
          style={{
            height: 1,
            background:
              'linear-gradient(90deg, rgba(243,193,75,0) 0%, rgba(243,193,75,0.55) 15%, rgba(243,193,75,0.55) 85%, rgba(243,193,75,0) 100%)',
          }}
        />
        <div
          className="px-4 py-3 text-sm whitespace-pre-line"
          style={{
            color: '#d8c89a',
            lineHeight: 1.7,
          }}
        >
          {description}
        </div>
        {rewards && rewards.length > 0 && (
          <>
            <div
              className="mx-3"
              style={{
                height: 1,
                background:
                  'linear-gradient(90deg, rgba(243,193,75,0) 0%, rgba(243,193,75,0.4) 15%, rgba(243,193,75,0.4) 85%, rgba(243,193,75,0) 100%)',
              }}
            />
            <div
              className="px-4 pt-2 pb-1 text-xs tracking-wide"
              style={{ color: '#f3c14b' }}
            >
              奖励信息
            </div>
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {rewards.map((r, i) => (
                <RewardCell key={i} reward={r} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function RewardCell({ reward }: { reward: RewardItem }) {
  return (
    <div
      className="relative shrink-0"
      style={{
        width: 52,
        height: 52,
        background:
          'linear-gradient(180deg, rgba(70,55,35,0.55) 0%, rgba(35,25,15,0.55) 100%)',
        border: '1px solid rgba(120,95,55,0.6)',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.5)',
      }}
    >
      <img
        src={reward.image}
        alt={reward.label ?? ''}
        draggable={false}
        className="absolute inset-0 w-full h-full object-contain p-0.5 select-none"
      />
      {typeof reward.count === 'number' && (
        <div
          className="absolute right-0 top-0 px-1 text-[11px] font-bold leading-tight"
          style={{
            color: '#ffffff',
            textShadow:
              '1px 1px 0 #000, -1px 1px 0 #000, 1px -1px 0 #000, -1px -1px 0 #000',
          }}
        >
          {reward.count}
        </div>
      )}
      {reward.label && (
        <div
          className="absolute left-0 right-0 bottom-0 text-center text-[10px] leading-tight px-0.5 truncate"
          style={{
            color: '#ead8b6',
            background: 'rgba(0,0,0,0.65)',
          }}
        >
          {reward.label}
        </div>
      )}
    </div>
  );
}
