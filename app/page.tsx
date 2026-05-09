import GuideShell from '@/components/GuideShell';
import type { GuideArea, GuideFloor } from '@/components/GuideShell';
import { getAreaDescriptions, listFloors } from '@/lib/labyrinth-loader';
import { floorUrl } from '@/lib/labyrinth-routes';

export default async function HomePage() {
  const [floors, descriptions] = await Promise.all([
    listFloors(),
    getAreaDescriptions(),
  ]);
  const map = new Map<number, GuideArea>();
  for (const f of floors) {
    const m = f.floor_id.match(/^lab\d+_f(\d+)/);
    if (!m) continue;
    const n = Number(m[1]);
    let group = map.get(n);
    if (!group) {
      group = {
        number: n,
        label: `第${n}区域`,
        title: f.name.split(' ')[0] ?? `第${n}区域`,
        description: descriptions[String(n)] ?? '',
        floors: [],
      };
      map.set(n, group);
    }
    const entry: GuideFloor = {
      floor_id: f.floor_id,
      name: f.name,
      url: floorUrl(f.floor_id),
      nodes: f.nodes.length,
      edges: f.edges.length,
    };
    group.floors.push(entry);
  }
  const groups = Array.from(map.values()).sort((a, b) => a.number - b.number);
  groups.forEach((g) =>
    g.floors.sort((a, b) => a.floor_id.localeCompare(b.floor_id)),
  );

  return <GuideShell sectionName="悖论迷宫" groups={groups} />;
}
