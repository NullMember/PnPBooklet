// State, DOM references, loading overlay helpers, and file loading (drag/drop,
// PDF extraction via pdf.js, image loading) for the Booklet Creator.

const MM_TO_PT = 72 / 25.4;
const MM_TO_PX = 96 / 25.4;
const PREVIEW_PDF_SCALE = 2;

// State
const state = {
  pages: [],       // { canvas, width, height, pdfPage?, src, pageNo, rotation } — canvas is preview resolution for PDF pages
  pageImages: [],  // rendered canvases for each page
  outputCanvases: [],
  pdfBytes: null,
  sourceFiles: [], // the files the pages came from (page.src indexes this), for project saving
};

// DOM
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const pageThumbs = document.getElementById('pageThumbs');
const downloadBtn = document.getElementById('downloadBtn');
const previewArea = document.getElementById('previewArea');
const emptyState = document.getElementById('emptyState');
const loading = document.getElementById('loading');
const loadingText = document.getElementById('loadingText');

PnP.dropzone(dropZone, { input: fileInput, onFiles: (files) => handleFiles(files) });

// Add files (images and/or PDFs) after the pages already loaded. A dropped
// batch is sorted by name; project loading keeps the given order.
async function handleFiles(files, { sort = true } = {}) {
  const fileArr = Array.from(files).filter(f => f.type === 'application/pdf' || f.type.startsWith('image/'));
  if (!fileArr.length) return;
  if (sort) fileArr.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  showLoading('Loading files...');
  try {
    for (const file of fileArr) {
      const src = state.sourceFiles.length;
      state.sourceFiles.push(file);
      if (file.type === 'application/pdf') await loadPDF(file, src);
      else await loadImage(file, src);
    }
  } catch (err) {
    console.error(err);
    alert(`Could not load a file: ${err.message}`);
  } finally {
    hideLoading();
  }
  pagesChanged();
}

async function loadPDF(file, src) {
  const arrayBuf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;

  for (let i = 1; i <= pdf.numPages; i++) {
    loadingText.textContent = `Extracting ${file.name}: page ${i}/${pdf.numPages}...`;
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: PREVIEW_PDF_SCALE });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    // Keep the pdf.js page so export can re-render it at the output DPI
    state.pages.push({ canvas, width: vp.width, height: vp.height, pdfPage: page, src, pageNo: i, rotation: 0 });
  }
}

async function loadImage(file, src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      state.pages.push({ canvas, width: img.naturalWidth, height: img.naturalHeight, src, pageNo: 0, rotation: 0 });
      URL.revokeObjectURL(img.src);
      resolve();
    };
    img.onerror = () => reject(new Error(`${file.name} is not a readable image`));
    img.src = URL.createObjectURL(file);
  });
}

function updateFileInfo() {
  if (!state.pages.length) {
    fileList.innerHTML = '';
    return;
  }
  const files = new Set(state.pages.map(p => p.src)).size;
  fileList.innerHTML = `
    <div class="file-info">
      <span class="name">${files} file(s)</span>
      <span class="page-count-badge">${state.pages.length} page(s)</span>
      <button class="remove" onclick="clearPages()">✕ Clear</button>
    </div>`;
}

function clearPages() {
  state.pages = [];
  state.pageImages = [];
  state.outputCanvases = [];
  state.pdfBytes = null;
  state.sourceFiles = [];
  fileList.innerHTML = '';
  pageThumbs.innerHTML = '';
  pageThumbs.classList.remove('page-strip');
  downloadBtn.disabled = true;
  previewArea.innerHTML = '';
  previewArea.appendChild(emptyState);
  emptyState.style.display = '';
  fileInput.value = '';
  updatePreview();
}

function showLoading(text) {
  loadingText.textContent = text || 'Processing...';
  loading.classList.remove('hidden');
}

function hideLoading() {
  loading.classList.add('hidden');
}

// Set pdfjsLib worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
