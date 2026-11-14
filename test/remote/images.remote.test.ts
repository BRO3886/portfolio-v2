import { env } from 'cloudflare:workers';
import { expect, it } from 'vitest';
import { fuji } from '../fixtures/images';

const bytes = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

function riffChunks(webp: Uint8Array) {
  const view = new DataView(webp.buffer, webp.byteOffset, webp.byteLength);
  const tag = (at: number) => String.fromCharCode(...webp.subarray(at, at + 4));
  expect(tag(0)).toBe('RIFF');
  expect(tag(8)).toBe('WEBP');
  const chunks: string[] = [];
  for (let at = 12; at + 8 <= webp.byteLength; ) {
    const size = view.getUint32(at + 4, true);
    chunks.push(tag(at));
    at += 8 + size + (size % 2);
  }
  return chunks;
}

const contains = (haystack: Uint8Array, needle: string) => {
  const n = new TextEncoder().encode(needle);
  outer: for (let i = 0; i + n.length <= haystack.length; i++) {
    for (let j = 0; j < n.length; j++) if (haystack[i + j] !== n[j]) continue outer;
    return true;
  }
  return false;
};

// The ingest's exact transform. The fixture carries GPS, a body serial and an owner name.
it.each([24, 640, 3072])('the real Images binding writes a %ipx WebP with no metadata', async (width) => {
  const input = bytes(fuji);
  expect(contains(input, '9AB12345')).toBe(true);
  const out = await env.IMAGES.input(new Blob([input]).stream()).transform({ width, fit: 'scale-down' }).output({ format: 'image/webp', quality: 80 });
  const webp = new Uint8Array(await new Response(out.image()).arrayBuffer());
  const chunks = riffChunks(webp);
  expect(chunks).not.toContain('EXIF');
  expect(chunks).not.toContain('XMP ');
  for (const needle of ['9AB12345', 'Test Owner', 'FUJIFILM', 'GPS']) expect(contains(webp, needle)).toBe(false);
});

// A 64x48 frame tagged Orientation 6, shown rotated a quarter turn. The ingest stores info()'s size as the displayed size.
const rotated = '/9j/4QC8RXhpZgAASUkqAAgAAAAGABIBAwABAAAABgAAABoBBQABAAAAVgAAABsBBQABAAAAXgAAACgBAwABAAAAAgAAABMCAwABAAAAAQAAAGmHBAABAAAAZgAAAAAAAAA4YwAA6AMAADhjAADoAwAABgAAkAcABAAAADAyMTABkQcABAAAAAECAwAAoAcABAAAADAxMDABoAMAAQAAAP//AAACoAQAAQAAAEAAAAADoAQAAQAAADAAAAAAAAAA/+IB8ElDQ19QUk9GSUxFAAEBAAAB4GxjbXMEIAAAbW50clJHQiBYWVogB+IAAwAUAAkADgAdYWNzcE1TRlQAAAAAc2F3c2N0cmwAAAAAAAAAAAAAAAAAAPbWAAEAAAAA0y1oYW5keem/Vlo+AbaDI4VVRvdPqgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAKZGVzYwAAAPwAAAAkY3BydAAAASAAAAAid3RwdAAAAUQAAAAUY2hhZAAAAVgAAAAsclhZWgAAAYQAAAAUZ1hZWgAAAZgAAAAUYlhZWgAAAawAAAAUclRSQwAAAcAAAAAgZ1RSQwAAAcAAAAAgYlRSQwAAAcAAAAAgbWx1YwAAAAAAAAABAAAADGVuVVMAAAAIAAAAHABzAFIARwBCbWx1YwAAAAAAAAABAAAADGVuVVMAAAAGAAAAHABDAEMAMAAAWFlaIAAAAAAAAPbWAAEAAAAA0y1zZjMyAAAAAAABDD8AAAXd///zJgAAB5AAAP2S///7of///aIAAAPcAADAcVhZWiAAAAAAAABvoAAAOPIAAAOPWFlaIAAAAAAAAGKWAAC3iQAAGNpYWVogAAAAAAAAJKAAAA+FAAC2xHBhcmEAAAAAAAMAAAACZmkAAPKnAAANWQAAE9AAAApb/9sAQwAGBAUGBQQGBgUGBwcGCAoQCgoJCQoUDg8MEBcUGBgXFBYWGh0lHxobIxwWFiAsICMmJykqKRkfLTAtKDAlKCko/9sAQwEHBwcKCAoTCgoTKBoWGigoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgo/8AAEQgAMABAAwEiAAIRAQMRAf/EABUAAQEAAAAAAAAAAAAAAAAAAAAF/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/EABUBAQEAAAAAAAAAAAAAAAAAAAAG/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AuAIxXAAAAAAAAAAAAAAAAAAAAAAP/9k=';

it('the real Images binding reports a rotated frame at its displayed size', async () => {
  const info = await env.IMAGES.info(new Blob([bytes(rotated)]).stream());
  expect(info).toMatchObject({ width: 48, height: 64 });
});
