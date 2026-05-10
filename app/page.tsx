import type { Metadata } from 'next';
import GuideShell from '@/components/GuideShell';
import type { GuideArea, GuideFloor } from '@/components/GuideShell';
import { getAreaDescriptions, listFloors } from '@/lib/labyrinth-loader';
import { floorUrl, FLOOR_ROUTES } from '@/lib/labyrinth-routes';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dnf.umi.cat';

interface HomePageProps {
  searchParams?: { area?: string };
}

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const area = Number(searchParams?.area);
  if (!Number.isFinite(area) || area <= 0) {
    return { alternates: { canonical: '/' } };
  }
  return {
    title: `第${area}区域 布局总览`,
    description: `DNF 悖论迷宫 第${area}区域全部布局列表与跳转。역설의 미궁 ${area}구역 공략. Labyrinth of Paradox area ${area} layouts — Dungeon Fighter Online.`,
    alternates: { canonical: `/?area=${area}` },
  };
}

export default async function HomePage({ searchParams }: HomePageProps) {
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

  const areaParam = Number(searchParams?.area);
  const selectedArea = Number.isFinite(areaParam) && areaParam > 0
    ? areaParam
    : groups[0]?.number;

  const websiteJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '悖论迷宫攻略',
    alternateName: [
      '역설의 미궁 공략',
      'Labyrinth of Paradox',
      'DNF Paradox Labyrinth Guide',
    ],
    url: SITE_URL,
    inLanguage: ['zh-CN', 'ko-KR', 'en-US'],
    potentialAction: {
      '@type': 'SearchAction',
      target: `${SITE_URL}/?area={area}`,
      'query-input': 'required name=area',
    },
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '悖论迷宫全区域布局',
    itemListElement: Object.keys(FLOOR_ROUTES).map((k, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/labyrinth/${k}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <GuideShell
        sectionName="悖论迷宫"
        groups={groups}
        selectedArea={selectedArea}
      />
    </>
  );
}
