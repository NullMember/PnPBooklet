// Bootstrap: wires up event listeners once all modules are loaded.

downloadBtn.addEventListener('click', () => downloadPDF());

// Attach listeners to all sidebar controls
document.querySelectorAll('.sidebar input, .sidebar select').forEach(el => {
  el.addEventListener('input', schedulePreview);
  el.addEventListener('change', schedulePreview);
});

// ---- Shared PnPTools wiring ----

PnP.bindPreset(document.getElementById('sheetPreset'), document.getElementById('sheetW'), document.getElementById('sheetH'), 'paper');
PnP.bindPreset(document.getElementById('pagePreset'), document.getElementById('pageW'), document.getElementById('pageH'), 'card');

PnP.importButton(document.getElementById('importSlot'), (files) => handleFiles(files));

document.getElementById('fitGridBtn').addEventListener('click', () => {
  const { cols, rows } = maxGridThatFits(readConfig());
  document.getElementById('cols').value = cols;
  document.getElementById('rows').value = rows;
  document.getElementById('rows').dispatchEvent(new Event('change', { bubbles: true }));
  schedulePreview();
});

PnP.init({
  tool: 'PnPBooklet',
  offlineFiles: [pdfjsLib.GlobalWorkerOptions.workerSrc],
  project: {
    getFiles: () => state.sourceFiles.map((f) => ({ name: f.name, blob: f, role: f.pnpRole })),
    getState: () => ({ pages: state.pages.map((p) => ({ src: p.src, pageNo: p.pageNo, rotation: p.rotation || 0 })) }),
    setFiles: async (files) => {
      clearPages();
      await handleFiles(files, { sort: false });
    },
    // Restore the saved page order, removals and rotations.
    setState: (saved) => {
      if (!saved || !saved.pages) return;
      const byKey = new Map(state.pages.map((p) => [`${p.src}:${p.pageNo}`, p]));
      state.pages = saved.pages.map((s) => {
        const p = byKey.get(`${s.src}:${s.pageNo}`);
        if (p) p.rotation = s.rotation || 0;
        return p;
      }).filter(Boolean);
      pagesChanged();
    },
  },
  hasUnsavedWork: () => state.pages.length > 0,
});

PnP.handoff.receive((items) => handleFiles(PnP.itemsToFiles(items)));
