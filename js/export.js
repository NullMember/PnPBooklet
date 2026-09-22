// PDF export: builds the full multi-sheet booklet PDF via jsPDF.

async function downloadPDF() {
  showLoading('Generating PDF...');

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

  const cellOrder = getCellOrder(rows, cols, direction);

  // --- Generate PDF ---
  const { jsPDF } = window.jspdf;
  const orientation = sheetW_mm > sheetH_mm ? 'l' : 'p';
  const pdf = new jsPDF({
    orientation,
    unit: 'mm',
    format: [sheetW_mm, sheetH_mm],
  });

  for (let s = 0; s < totalSheets; s++) {
    loadingText.textContent = `Building PDF page ${s + 1}/${totalSheets}...`;
    if (s > 0) pdf.addPage([sheetW_mm, sheetH_mm], orientation);

    for (let i = 0; i < pagesPerSheet; i++) {
      const pageIdx = s * pagesPerSheet + i;
      if (pageIdx >= state.pages.length) break;

      const [row, col] = cellOrder[i];
      const x_mm = offsetX_mm + col * (pageW_mm + colGap_mm);
      const y_mm = offsetY_mm + row * (pageH_mm + rowGap_mm);

      // Crop source and add image
      const pg = state.pages[pageIdx];
      const srcW = pg.width;
      const srcH = pg.height;
      const origW_mm = pageW_mm + cropLeft_mm + cropRight_mm;
      const origH_mm = pageH_mm + cropTop_mm + cropBottom_mm;
      const sx = (cropLeft_mm / origW_mm) * srcW;
      const sy = (cropTop_mm / origH_mm) * srcH;
      const sw = (pageW_mm / origW_mm) * srcW;
      const sh = (pageH_mm / origH_mm) * srcH;
      const cropCanvas = document.createElement('canvas');
      cropCanvas.width = Math.round(sw);
      cropCanvas.height = Math.round(sh);
      cropCanvas.getContext('2d').drawImage(pg.canvas, sx, sy, sw, sh, 0, 0, cropCanvas.width, cropCanvas.height);
      const dataURL = cropCanvas.toDataURL('image/jpeg', 0.92);
      pdf.addImage(dataURL, 'JPEG', x_mm, y_mm, pageW_mm, pageH_mm);

      // Draw page number in PDF
      if (pageNumEnabled) {
        const numText = String(pageIdx + pageNumStart);
        const fontSizePt = pageNumSize;
        pdf.setFontSize(fontSizePt);
        pdf.setTextColor(pageNumColor);
        let tx_mm, ty_mm, align;
        if (pageNumPos.endsWith('left')) {
          align = 'left';
          tx_mm = x_mm + pageNumOffset_mm;
        } else if (pageNumPos.endsWith('right')) {
          align = 'right';
          tx_mm = x_mm + pageW_mm - pageNumOffset_mm;
        } else {
          align = 'center';
          tx_mm = x_mm + pageW_mm / 2;
        }
        const fontH_mm = fontSizePt * 0.352778;
        if (pageNumPos.startsWith('top')) {
          ty_mm = y_mm + pageNumOffset_mm + fontH_mm;
        } else {
          ty_mm = y_mm + pageH_mm - pageNumOffset_mm;
        }
        pdf.text(numText, tx_mm, ty_mm, { align });
      }

      // Draw borders in PDF
      if (borderStyle !== 'none') {
        pdf.setDrawColor(borderColor);
        pdf.setLineWidth(borderWidth * 0.352778); // pt to mm

        if (borderStyle === 'solid') {
          pdf.setLineDashPattern([], 0);
          pdf.rect(x_mm, y_mm, pageW_mm, pageH_mm, 'S');
        } else if (borderStyle === 'dotted') {
          pdf.setLineDashPattern([0.5, 0.5], 0);
          pdf.rect(x_mm, y_mm, pageW_mm, pageH_mm, 'S');
          pdf.setLineDashPattern([], 0);
        } else if (borderStyle === 'double') {
          const off = borderWidth * 0.352778 * 2;
          pdf.setLineDashPattern([], 0);
          pdf.rect(x_mm, y_mm, pageW_mm, pageH_mm, 'S');
          pdf.rect(x_mm + off, y_mm + off, pageW_mm - 2 * off, pageH_mm - 2 * off, 'S');
        } else if (borderStyle === 'double-dotted') {
          const off = borderWidth * 0.352778 * 2;
          pdf.setLineDashPattern([0.5, 0.5], 0);
          pdf.rect(x_mm, y_mm, pageW_mm, pageH_mm, 'S');
          pdf.rect(x_mm + off, y_mm + off, pageW_mm - 2 * off, pageH_mm - 2 * off, 'S');
          pdf.setLineDashPattern([], 0);
        }
      }
    }

    await new Promise(r => setTimeout(r, 0));
  }

  pdf.save('booklet.pdf');
  hideLoading();
}
