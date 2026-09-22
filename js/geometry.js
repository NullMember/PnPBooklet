// Shared geometry helpers used by both the live preview and the PDF export:
// grid cell ordering and cell border drawing.

// Shared cell order builder
function getCellOrder(r, c, direction) {
  const cells = [];
  if (direction === 'lr-tb') {
    for (let row = 0; row < r; row++)
      for (let col = 0; col < c; col++)
        cells.push([row, col]);
  } else if (direction === 'tb-lr') {
    for (let col = 0; col < c; col++)
      for (let row = 0; row < r; row++)
        cells.push([row, col]);
  } else if (direction === 'rl-tb') {
    for (let row = 0; row < r; row++)
      for (let col = c - 1; col >= 0; col--)
        cells.push([row, col]);
  } else if (direction === 'tb-rl') {
    for (let col = c - 1; col >= 0; col--)
      for (let row = 0; row < r; row++)
        cells.push([row, col]);
  }
  return cells;
}

// Shared draw borders utility
function drawBorders(ctx, x, y, w, h, style, lineWidth, color, scale) {
  if (style === 'none') return;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth * scale;

  if (style === 'solid') {
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, w, h);
  } else if (style === 'dotted') {
    ctx.setLineDash([2 * scale, 2 * scale]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
  } else if (style === 'double') {
    const offset = lineWidth * scale * 2;
    ctx.setLineDash([]);
    ctx.strokeRect(x, y, w, h);
    ctx.strokeRect(x + offset, y + offset, w - 2 * offset, h - 2 * offset);
  } else if (style === 'double-dotted') {
    const offset = lineWidth * scale * 2;
    ctx.setLineDash([2 * scale, 2 * scale]);
    ctx.strokeRect(x, y, w, h);
    ctx.strokeRect(x + offset, y + offset, w - 2 * offset, h - 2 * offset);
    ctx.setLineDash([]);
  }
}
