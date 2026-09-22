// Page thumbnail rendering for the sidebar thumbnails strip.

function renderThumbs() {
  pageThumbs.innerHTML = '';
  state.pages.forEach((p, i) => {
    const thumb = document.createElement('canvas');
    thumb.width = 48;
    thumb.height = 64;
    const ctx = thumb.getContext('2d');
    const scale = Math.min(48 / p.width, 64 / p.height);
    const w = p.width * scale, h = p.height * scale;
    ctx.drawImage(p.canvas, (48 - w) / 2, (64 - h) / 2, w, h);
    thumb.title = `Page ${i + 1}`;
    pageThumbs.appendChild(thumb);
  });
}
