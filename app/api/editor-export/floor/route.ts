import { NextRequest, NextResponse } from 'next/server';
import { getFloor } from '@/lib/labyrinth-loader';

function safeFloorId(value: string | null): string | null {
  return value && /^[A-Za-z0-9_-]+$/.test(value) ? value : null;
}

export async function GET(req: NextRequest) {
  const floorId = safeFloorId(req.nextUrl.searchParams.get('floor_id'));
  if (!floorId) {
    return new NextResponse('invalid floor_id', { status: 400 });
  }
  const floor = await getFloor(floorId);
  if (!floor) {
    return new NextResponse('not found', { status: 404 });
  }
  return NextResponse.json(floor);
}
