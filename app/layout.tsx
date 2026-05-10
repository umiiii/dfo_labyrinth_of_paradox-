import type { Metadata } from 'next';
import Script from 'next/script';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';

export const metadata: Metadata = {
  title: '悖论迷宫',
  description: 'Paradox Labyrinth',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/cn-fontsource-source-han-serif-sc-vf@1.0.9/font.min.css"
        />
      </head>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
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
