import p0 from '../../../../assets/ep02/part00.txt?raw';
import p1 from '../../../../assets/ep02/part01.txt?raw';
import p2 from '../../../../assets/ep02/part02.txt?raw';
import p3 from '../../../../assets/ep02/part03.txt?raw';
import p4 from '../../../../assets/ep02/part04.txt?raw';
import p5 from '../../../../assets/ep02/part05.txt?raw';
import p6 from '../../../../assets/ep02/part06.txt?raw';

export const prerender = true;

export function GET() {
  const b64 = [p0, p1, p2, p3, p4, p5, p6].join('').replace(/\s+/g, '');
  const bytes = Uint8Array.from(Buffer.from(b64, 'base64'));
  return new Response(bytes, {
    headers: {
      'Content-Type': 'image/webp',
      'Cache-Control': 'public, max-age=31536000, immutable'
    }
  });
}
