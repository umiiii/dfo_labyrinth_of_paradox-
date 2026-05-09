import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import type { Floor } from '@/types/labyrinth';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'data', 'floors');

function safeFloorId(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value)
    ? value
    : null;
}

export async function POST(req: NextRequest) {
  const floor = (await req.json()) as Floor;
  const floorId = safeFloorId(floor.floor_id);
  if (!floorId) {
    return new NextResponse('invalid floor_id', { status: 400 });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, `${floorId}.json`),
    `${JSON.stringify(floor, null, 2)}\n`,
    'utf8',
  );
  return NextResponse.json({ ok: true });
}
