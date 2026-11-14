// Blur-up: the real image fades in over its placeholder once decoded.
export function hydrateImages(root: ParentNode) {
  root.querySelectorAll<HTMLImageElement>('.lqip:not([data-loaded]) img').forEach((img) => {
    const box = img.parentElement!;
    const reveal = () => box.setAttribute('data-loaded', '');
    if (img.complete && img.naturalWidth) img.decode().then(reveal, reveal);
    else {
      img.addEventListener('load', () => img.decode().then(reveal, reveal), { once: true });
      img.addEventListener('error', reveal, { once: true });
    }
  });
}
