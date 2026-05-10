import type { NextRequest } from 'next/server';

export function isLocalRequest(req: NextRequest): boolean {
  const host = req.headers.get('host') ?? '';
  const hostname = host.split(':')[0];
  return (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname === '[::1]'
  );
}
