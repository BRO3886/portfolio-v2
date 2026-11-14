const TYPE_SIZE: Record<number, number> = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 6: 1, 7: 1, 8: 2, 9: 4, 10: 8, 11: 4, 12: 8 };
const GPS_INFO = 0x8825;

/*
  Blanks the EXIF GPS block of a JPEG in place: every GPS value is zeroed and the block's entry count set to 0, so
  readers see no location. Nothing moves, so every other offset, the rest of the metadata and the image data stay
  byte for byte. Returns the input untouched when there is no EXIF or no GPS block. iPhone JPEGs keep location only
  here; their XMP holds lens and dates.
*/
export function stripGps(jpeg: Uint8Array): Uint8Array {
  const out = jpeg.slice();
  const view = new DataView(out.buffer, out.byteOffset, out.byteLength);
  let i = 2;
  while (i + 4 <= out.length && out[i] === 0xff) {
    const marker = out[i + 1];
    if (marker === 0xda || marker === 0xd9) break;
    const length = view.getUint16(i + 2);
    const start = i + 4;
    if (marker === 0xe1 && length >= 14 && String.fromCharCode(...out.subarray(start, start + 6)) === 'Exif\0\0') {
      return blankGps(out, view, start + 6, i + 2 + length) ? out : jpeg;
    }
    i += 2 + length;
  }
  return jpeg;
}

function blankGps(out: Uint8Array, view: DataView, tiff: number, end: number): boolean {
  const little = out[tiff] === 0x49;
  const u16 = (at: number) => view.getUint16(at, little);
  const u32 = (at: number) => view.getUint32(at, little);
  const inside = (at: number, size: number) => at >= tiff && at + size <= end;

  const ifd0 = tiff + u32(tiff + 4);
  if (!inside(ifd0, 2)) return false;
  let gps = -1;
  for (let k = 0, n = u16(ifd0); k < n; k++) {
    const entry = ifd0 + 2 + k * 12;
    if (inside(entry, 12) && u16(entry) === GPS_INFO) gps = tiff + u32(entry + 8);
  }
  if (gps < 0 || !inside(gps, 2)) return false;

  const count = u16(gps);
  if (count === 0) return false;
  for (let k = 0; k < count; k++) {
    const entry = gps + 2 + k * 12;
    if (!inside(entry, 12)) break;
    const bytes = (TYPE_SIZE[u16(entry + 2)] ?? 1) * u32(entry + 4);
    const value = bytes <= 4 ? entry + 8 : tiff + u32(entry + 8);
    if (inside(value, bytes)) out.fill(0, value, value + bytes);
    out.fill(0, entry, entry + 12);
  }
  view.setUint16(gps, 0, little);
  return true;
}
