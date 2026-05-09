import Link from 'next/link';

interface TopBarProps {
  level: number;
  title: string;
}

export default function TopBar({ title }: TopBarProps) {
  return (
    <div
      className="relative w-full flex items-center"
      style={{
        height: 56,
        background:
          'linear-gradient(180deg, rgba(38, 22, 12, 0.95) 0%, rgba(20, 12, 6, 0.95) 100%)',
        borderBottom: '2px solid rgba(180, 130, 60, 0.45)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.6)',
      }}
    >
      <Link
        href="/"
        className="absolute flex items-center gap-1 text-amber-300 hover:text-amber-100 transition"
        style={{
          left: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 14,
        }}
      >
        <span aria-hidden style={{ fontSize: 18, lineHeight: 1 }}>
          ←
        </span>
        <span>返回导航</span>
      </Link>

      <div
        className="title-text absolute"
        style={{
          left: 140,
          top: '50%',
          transform: 'translateY(-50%)',
          fontSize: 38,
        }}
      >
        {title}
      </div>
    </div>
  );
}
