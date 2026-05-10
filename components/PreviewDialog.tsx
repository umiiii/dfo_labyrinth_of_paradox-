'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Floor, IconDict } from '@/types/labyrinth';
import LabyrinthBoard from './LabyrinthBoard';
import TopBar from './TopBar';
import BottomBar from './BottomBar';

interface PreviewDialogProps {
  floor: Floor;
  iconDict: IconDict;
  onClose: () => void;
}

export default function PreviewDialog({
  floor,
  iconDict,
  onClose,
}: PreviewDialogProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] wood-bg flex items-center justify-center overflow-hidden"
      onClick={onClose}
    >
      <div
        className="relative shadow-2xl labyrinth-frame"
        style={{
          background: '#1a0e06',
          border: '1px solid rgba(120,80,40,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <TopBar
          level={1}
          title={`${floor.name} · 预览模式`}
          onBack={onClose}
        />
        <div
          className="relative"
          style={{ height: 'calc(100% - 56px - 56px)' }}
        >
          <LabyrinthBoard floor={floor} iconDict={iconDict} />
        </div>
        <BottomBar />
      </div>
    </div>,
    document.body,
  );
}
