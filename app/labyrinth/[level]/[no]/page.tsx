import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getFloor, getIconDict } from '@/lib/labyrinth-loader';
import { FLOOR_ROUTES } from '@/lib/labyrinth-routes';
import TopBar from '@/components/TopBar';
import BottomBar from '@/components/BottomBar';
import LabyrinthBoard from '@/components/LabyrinthBoard';
import Pager from '@/components/Pager';

interface Params {
  params: { level: string; no: string };
}

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dnf.umi.cat';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  return Object.keys(FLOOR_ROUTES).map((k) => {
    const [level, no] = k.split('/');
    return { level, no };
  });
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const level = Number(params.level);
  const no = Number(params.no);
  const floorId = FLOOR_ROUTES[`${params.level}/${params.no}`];
  if (!floorId) return {};
  const floor = await getFloor(floorId);
  if (!floor) return {};

  const path = `/labyrinth/${params.level}/${params.no}`;
  const title = `第${level}区域 · ${floor.name}`;
  const description = `DNF 悖论迷宫 第${level}区域 第${no}张布局「${floor.name}」：${floor.nodes.length} 个节点、${floor.edges.length} 条路径，节点图标与奖励掉落速查。역설의 미궁 ${level}-${no} ${floor.name} 공략. Labyrinth of Paradox area ${level} layout ${no} (${floor.name}) — Dungeon Fighter Online maze guide.`;

  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      url: `${SITE_URL}${path}`,
      title: `${title} | 悖论迷宫攻略`,
      description,
      locale: 'zh_CN',
      alternateLocale: ['ko_KR', 'en_US'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | 悖论迷宫攻略`,
      description,
    },
  };
}

export default async function LabyrinthPage({ params }: Params) {
  const level = Number(params.level);
  const no = Number(params.no);

  if (![1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].includes(level)) notFound();
  if (!Number.isInteger(no) || no < 1) notFound();

  const floorId = FLOOR_ROUTES[`${params.level}/${params.no}`];
  if (!floorId) notFound();

  const floor = await getFloor(floorId);
  if (!floor) notFound();

  const iconDict = await getIconDict();

  const path = `/labyrinth/${params.level}/${params.no}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `第${level}区域 · ${floor.name}`,
    name: floor.name,
    description: `DNF 悖论迷宫 第${level}区域第${no}张布局：${floor.name}（역설의 미궁 / Labyrinth of Paradox - Dungeon Fighter Online）`,
    inLanguage: ['zh-CN', 'ko-KR', 'en-US'],
    url: `${SITE_URL}${path}`,
    isPartOf: {
      '@type': 'WebSite',
      name: '悖论迷宫攻略',
      url: SITE_URL,
    },
    author: { '@type': 'Person', name: 'umi_' },
    keywords: [
      '悖论迷宫',
      'DNF',
      `第${level}区域`,
      floor.name,
      '역설의 미궁',
      '던전앤파이터',
      '던파',
      'labyrinth of paradox',
      'dungeon fighter online',
    ].join(', '),
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}${path}` },
  };

  return (
    <main className="wood-bg w-screen h-screen flex items-center justify-center overflow-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        className="relative shadow-2xl labyrinth-frame"
        style={{
          background: '#1a0e06',
          border: '1px solid rgba(120,80,40,0.5)',
        }}
      >
        <TopBar level={level} title={floor.name} />

        <div
          className="relative"
          style={{ height: 'calc(100% - 56px - 56px)' }}
        >
          <LabyrinthBoard floor={floor} iconDict={iconDict} />
          <Pager level={level} no={no} max={5} />
        </div>

        <BottomBar />
      </div>
    </main>
  );
}
