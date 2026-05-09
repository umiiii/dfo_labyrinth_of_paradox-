import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, 'floor');

function safeFloorId(value: unknown): string | null {
  return typeof value === 'string' && /^[A-Za-z0-9_-]+$/.test(value)
    ? value
    : null;
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const floorId = safeFloorId(form.get('floor_id'));
  const image = form.get('image');
  if (!floorId || !(image instanceof File)) {
    return new NextResponse('invalid export payload', { status: 400 });
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(
    path.join(OUT_DIR, `${floorId}.png`),
    Buffer.from(await image.arrayBuffer()),
  );
  return NextResponse.json({ ok: true });
}
