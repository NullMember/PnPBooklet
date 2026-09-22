// Bootstrap: wires up event listeners once all modules are loaded.

downloadBtn.addEventListener('click', () => downloadPDF());

// Attach listeners to all sidebar controls
document.querySelectorAll('.sidebar input, .sidebar select').forEach(el => {
  el.addEventListener('input', schedulePreview);
  el.addEventListener('change', schedulePreview);
});
