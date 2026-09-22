// Live canvas preview generation (renders sheet 1 of the booklet layout).

// Live preview update
let previewTimer = null;
function schedulePreview() {
  clearTimeout(previewTimer);
  previewTimer = setTimeout(updatePreview, 80);
}

function updatePreview() {
  if (state.pages.length === 0) return;
  generatePreviewSheet();
}

// Generate preview (first sheet only, synchronous-ish)
function generatePreviewSheet() {
  const sheetW_mm = parseFloat(document.getElementById('sheetW').value);
  const sheetH_mm = parseFloat(document.getElementById('sheetH').value);
  const pageW_mm = parseFloat(document.getElementById('pageW').value);
  const pageH_mm = parseFloat(document.getElementById('pageH').value);
  const cols = parseInt(document.getElementById('cols').value);
  const rows = parseInt(document.getElementById('rows').value);
  const direction = document.getElementById('direction').value;
  const borderStyle = document.getElementById('borderStyle').value;
  const borderWidth = parseFloat(document.getElementById('borderWidth').value);
  const borderColor = document.getElementById('borderColor').value;
  const colGap_mm = parseFloat(document.getElementById('colGap').value);
  const rowGap_mm = parseFloat(document.getElementById('rowGap').value);
  const cropTop_mm = parseFloat(document.getElementById('cropTop').value);
  const cropBottom_mm = parseFloat(document.getElementById('cropBottom').value);
  const cropLeft_mm = parseFloat(document.getElementById('cropLeft').value);
  const cropRight_mm = parseFloat(document.getElementById('cropRight').value);
  const pageNumEnabled = document.getElementById('pageNumEnabled').value === 'on';
  const pageNumPos = document.getElementById('pageNumPos').value;
  const pageNumSize = parseFloat(document.getElementById('pageNumSize').value);
  const pageNumStart = parseInt(document.getElementById('pageNumStart').value);
  const pageNumColor = document.getElementById('pageNumColor').value;
  const pageNumOffset_mm = parseFloat(document.getElementById('pageNumOffset').value);

  const pagesPerSheet = rows * cols;
  const totalSheets = Math.ceil(state.pages.length / pagesPerSheet);

  const gridW_mm = cols * pageW_mm + (cols - 1) * colGap_mm;
  const gridH_mm = rows * pageH_mm + (rows - 1) * rowGap_mm;
  const offsetX_mm = (sheetW_mm - gridW_mm) / 2;
  const offsetY_mm = (sheetH_mm - gridH_mm) / 2;

  const previewScale = Math.min(
    (previewArea.clientWidth - 56) / (sheetW_mm * MM_TO_PX),
    1.5
  );

  const canvasW = Math.round(sheetW_mm * MM_TO_PX * previewScale);
  const canvasH = Math.round(sheetH_mm * MM_TO_PX * previewScale);
  const pxPerMM = canvasW / sheetW_mm;

  const cellOrder = getCellOrder(rows, cols, direction);

  // Render first sheet only
  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  for (let i = 0; i < pagesPerSheet; i++) {
    const pageIdx = i;
    if (pageIdx >= state.pages.length) break;

    const [row, col] = cellOrder[i];
    const x = (offsetX_mm + col * (pageW_mm + colGap_mm)) * pxPerMM;
    const y = (offsetY_mm + row * (pageH_mm + rowGap_mm)) * pxPerMM;
    const w = pageW_mm * pxPerMM;
    const h = pageH_mm * pxPerMM;

    const pg = state.pages[pageIdx];
    const srcW = pg.width;
    const srcH = pg.height;
    const origW_mm = pageW_mm + cropLeft_mm + cropRight_mm;
    const origH_mm = pageH_mm + cropTop_mm + cropBottom_mm;
    const sx = (cropLeft_mm / origW_mm) * srcW;
    const sy = (cropTop_mm / origH_mm) * srcH;
    const sw = (pageW_mm / origW_mm) * srcW;
    const sh = (pageH_mm / origH_mm) * srcH;
    ctx.drawImage(pg.canvas, sx, sy, sw, sh, x, y, w, h);
    drawBorders(ctx, x, y, w, h, borderStyle, borderWidth, borderColor, pxPerMM / MM_TO_PT);

    if (pageNumEnabled) {
      const numText = String(pageIdx + pageNumStart);
      const fontSize = pageNumSize * (pxPerMM / MM_TO_PT);
      const offsetPx = pageNumOffset_mm * pxPerMM;
      ctx.font = `${fontSize}px sans-serif`;
      ctx.fillStyle = pageNumColor;
      ctx.textBaseline = pageNumPos.startsWith('top') ? 'top' : 'bottom';
      let tx, ty;
      if (pageNumPos.endsWith('left')) {
        ctx.textAlign = 'left';
        tx = x + offsetPx;
      } else if (pageNumPos.endsWith('right')) {
        ctx.textAlign = 'right';
        tx = x + w - offsetPx;
      } else {
        ctx.textAlign = 'center';
        tx = x + w / 2;
      }
      ty = pageNumPos.startsWith('top') ? y + offsetPx : y + h - offsetPx;
      ctx.fillText(numText, tx, ty);
    }
  }

  previewArea.innerHTML = '';
  emptyState.style.display = 'none';
  const stack = document.createElement('div');
  stack.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px;';
  const info = document.createElement('div');
  info.style.cssText = 'text-align:center;color:var(--text-dim);font-size:0.75rem;';
  info.textContent = `Sheet 1 of ${totalSheets} · Preview`;
  stack.appendChild(info);
  const wrapper = document.createElement('div');
  wrapper.className = 'preview-page';
  wrapper.appendChild(canvas);
  stack.appendChild(wrapper);
  previewArea.appendChild(stack);
}
