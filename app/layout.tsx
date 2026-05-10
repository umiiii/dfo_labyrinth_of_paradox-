import type { Metadata, Viewport } from 'next';
import { Noto_Serif_SC } from 'next/font/google';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://dnf.umi.cat';

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-noto-serif-sc',
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default:
      '悖论迷宫攻略 | 역설의 미궁 공략 | Labyrinth of Paradox - Dungeon Fighter Online',
    template: '%s | 悖论迷宫攻略 역설의 미궁',
  },
  description:
    'DNF 悖论迷宫 (역설의 미궁 / Labyrinth of Paradox) 全 11 区域 55 张地图布局、节点图标、奖励掉落速查。Dungeon Fighter Online 던전앤파이터 던파 역설의 미궁 미궁 공략 보상 지도.',
  keywords: [
    '悖论迷宫',
    '悖论迷宫攻略',
    'DNF',
    '地下城与勇士',
    '迷宫攻略',
    '布局',
    '奖励',
    '역설의 미궁',
    '역설의 미궁 공략',
    '역설의미궁',
    '던전앤파이터',
    '던파',
    '던파 공략',
    '던파 미궁',
    '미궁 공략',
    '미궁 보상',
    '미궁 지도',
    '던전 앤 파이터',
    '공략',
    '보상',
    '지도',
    'labyrinth of paradox',
    'paradox labyrinth',
    'dungeon fighter online',
    'dungeon and fighter',
    'dnf',
    'dnf labyrinth',
    'dnf paradox labyrinth',
    'dnf labyrinth guide',
    'dnf maze',
    'dnf maze guide',
  ],
  applicationName: '悖论迷宫攻略',
  authors: [{ name: 'umi_' }],
  creator: 'umi_',
  publisher: 'umi_',
  alternates: {
    canonical: '/',
    languages: {
      'zh-CN': '/',
      'ko-KR': '/',
      'en-US': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    alternateLocale: ['ko_KR', 'en_US'],
    url: SITE_URL,
    siteName: '悖论迷宫攻略',
    title:
      '悖论迷宫攻略 | 역설의 미궁 | Labyrinth of Paradox - Dungeon Fighter Online',
    description:
      'DNF 悖论迷宫 / 역설의 미궁 / Labyrinth of Paradox：全 11 区域 55 张地图布局、节点图标与奖励一图速查。',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: '悖论迷宫 역설의 미궁 Labyrinth of Paradox',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '悖论迷宫攻略 | 역설의 미궁 | Labyrinth of Paradox',
    description:
      'DNF 悖论迷宫 / 역설의 미궁 全区域布局与奖励速查。Dungeon Fighter Online 던파 역설의 미궁 공략.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'games',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  themeColor: '#1a0f08',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={notoSerifSC.variable}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <Script
          id="google-adsense"
          strategy="lazyOnload"
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6345227285458042"
          crossOrigin="anonymous"
        />
        <Script
          id="ga-loader"
          async
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-K05J1EKYH2"
        />
        <Script id="ga-init" strategy="afterInteractive">
          {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-K05J1EKYH2')`}
        </Script>
        <Script
          id="LA_COLLECT"
          strategy="afterInteractive"
          src="https://sdk.51.la/js-sdk-pro.min.js"
        />
        <Script id="LA_INIT" strategy="afterInteractive">
          {`(function(){function go(){if(window.LA){LA.init({id:"3Pt8tur8lVhPZ86N",ck:"3Pt8tur8lVhPZ86N",autoTrack:true,hashMode:true})}else{setTimeout(go,30)}}go()})()`}
        </Script>
      </body>
    </html>
  );
}
