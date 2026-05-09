'use client';

import { useState } from 'react';
import Link from 'next/link';

export interface GuideFloor {
  floor_id: string;
  name: string;
  url: string | null;
  nodes: number;
  edges: number;
}

export interface GuideArea {
  number: number;
  label: string;
  title: string;
  description: string;
  floors: GuideFloor[];
}

interface Props {
  sectionName: string;
  groups: GuideArea[];
}

export default function GuideShell({ sectionName, groups }: Props) {
  const [selected, setSelected] = useState<number>(groups[0]?.number ?? 0);
  const current = groups.find((g) => g.number === selected) ?? groups[0];

  return (
    <main className="wood-bg w-screen h-screen flex overflow-hidden text-amber-100">
      <aside className="w-72 h-full overflow-y-auto bg-stone-950/80 border-r border-amber-900/40 flex flex-col">
        <div className="px-4 pt-6 pb-4 text-4xl font-semibold text-amber-200 border-l-[3px] border-amber-500 ml-3">
          {sectionName}
        </div>

        <ul className="flex-1 py-2 px-2 space-y-1">
          {groups.map((g) => {
            const isSelected = g.number === selected;
            return (
              <li key={g.number}>
                <button
                  type="button"
                  onClick={() => setSelected(g.number)}
                  className={`relative w-full flex items-center gap-3 px-3 py-2 rounded transition border ${
                    isSelected
                      ? 'border-amber-400 bg-stone-900 ring-1 ring-amber-400/60'
                      : 'border-stone-800 bg-stone-900/40 hover:bg-stone-800/70 hover:border-stone-700'
                  }`}
                >
                  <span
                    className={`shrink-0 w-9 h-9 inline-flex items-center justify-center rounded border ${
                      isSelected
                        ? 'border-amber-400 bg-stone-800 text-amber-300'
                        : 'border-amber-700/40 bg-stone-800 text-amber-500/80'
                    }`}
                  >
                    <span className="text-base font-semibold">
                      {romanize(g.number)}
                    </span>
                  </span>
                  <span
                    className={`flex-1 text-left text-xl ${
                      isSelected ? 'gold-text font-semibold' : 'text-amber-100'
                    }`}
                  >
                    {g.label}
                  </span>
                  <span
                    className={`text-xs ${
                      isSelected ? 'text-amber-300' : 'text-stone-400'
                    }`}
                  >
                    ({g.floors.length})
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-stone-800 p-3 text-center text-xs text-stone-400">
          <a
            href="https://bbs.colg.cn/home.php?mod=spacecp"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-300"
          >
            by umi_
          </a>
        </div>
      </aside>

      <section className="flex-1 h-full flex flex-col overflow-hidden">
        <header className="px-8 pt-6 pb-4 border-b border-stone-800 bg-gradient-to-b from-stone-950/80 to-transparent">
          <div className="flex items-baseline gap-4">
            <h1 className="title-text text-3xl">{current?.label ?? ''}</h1>
            <span className="text-xs text-stone-400 tracking-widest">
              {sectionName} 
            </span>
          </div>
          <p className="text-sm text-amber-300/80 mt-3 whitespace-pre-line">
            {current?.description?.trim()
              ? current.description
              : '沿中线分隔，将右半部分各行的节点数自上而下排列，即得布局编号。'}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto px-8 py-6">
          {current && current.floors.length > 0 ? (
            <div className="border border-stone-700 rounded overflow-hidden bg-stone-950/40">
              <table className="w-full text-sm">
                <thead className="bg-stone-900/90 text-amber-300/90 text-lg">
                  <tr>
                    <th className="text-left px-4 py-2 font-normal">迷宫名称</th>
                    <th className="text-right px-4 py-2 font-normal w-28">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {current.floors.map((f, i) => (
                    <tr
                      key={f.floor_id}
                      className={`border-t border-stone-800 ${
                        i % 2 === 0 ? 'bg-stone-900/30' : 'bg-stone-900/10'
                      } hover:bg-stone-800/60 transition`}
                    >
                      <td className="px-4 py-2 text-amber-100">{f.name}</td>
                      <td className="px-4 py-2 text-right">
                        {f.url ? (
                          <Link
                            href={f.url}
                            className="inline-block px-3 py-1 text-xs bg-amber-700 border border-amber-500 rounded hover:bg-amber-600"
                          >
                            立即前往
                          </Link>
                        ) : (
                          <span className="text-xs text-stone-500">未上线</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-stone-400">该区域暂无迷宫</div>
          )}
        </div>
      </section>
    </main>
  );
}

const ROMAN: Array<[number, string]> = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

function romanize(n: number): string {
  if (n <= 0) return String(n);
  let v = n;
  let out = '';
  for (const [num, sym] of ROMAN) {
    while (v >= num) {
      out += sym;
      v -= num;
    }
  }
  return out;
}
