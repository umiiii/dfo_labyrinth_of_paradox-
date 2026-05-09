import { promises as fs } from 'fs';
import path from 'path';
import type { Floor, IconDict } from '@/types/labyrinth';

export { deriveEdges, resolveIcon } from './floor-utils';

const FLOORS_DIR = path.join(process.cwd(), 'data', 'floors');
const ICONS_PATH = path.join(process.cwd(), 'data', 'icons.json');
const AREA_DESCRIPTIONS_PATH = path.join(
  process.cwd(),
  'data',
  'area-descriptions.json',
);

async function readJsonOrNull<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code?: string }).code === 'ENOENT'
    ) {
      return null;
    }
    throw err;
  }
}

export async function getFloor(floorId: string): Promise<Floor | null> {
  return readJsonOrNull<Floor>(path.join(FLOORS_DIR, `${floorId}.json`));
}

export async function listFloors(): Promise<Floor[]> {
  let entries: string[];
  try {
    entries = await fs.readdir(FLOORS_DIR);
  } catch {
    return [];
  }
  const loaded = await Promise.all(
    entries
      .filter((f) => f.endsWith('.json'))
      .map((f) => readJsonOrNull<Floor>(path.join(FLOORS_DIR, f))),
  );
  return loaded.filter((f): f is Floor => !!f);
}

export async function getIconDict(): Promise<IconDict> {
  const dict = await readJsonOrNull<IconDict>(ICONS_PATH);
  return dict ?? {};
}

export async function getAreaDescriptions(): Promise<Record<string, string>> {
  const dict = await readJsonOrNull<Record<string, string>>(
    AREA_DESCRIPTIONS_PATH,
  );
  return dict ?? {};
}
