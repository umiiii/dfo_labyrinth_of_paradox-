import { NextResponse } from 'next/server';
import { listFloors } from '@/lib/labyrinth-loader';

export async function GET() {
  const floors = await listFloors();
  const summary = floors
    .map((f) => ({ floor_id: f.floor_id, name: f.name }))
    .sort((a, b) => a.floor_id.localeCompare(b.floor_id));
  return NextResponse.json({ floors: summary });
}
