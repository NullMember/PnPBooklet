// State, DOM references, loading overlay helpers, and file loading (drag/drop,
// PDF extraction via pdf.js, image loading) for the Booklet Creator.

const MM_TO_PT = 72 / 25.4;
const MM_TO_PX = 96 / 25.4;

// State
const state = {
  pages: [],       // Array of { type: 'image'|'pdf-page', data: ImageBitmap|canvas, width, height }
  pageImages: [],  // rendered canvases for each page
  outputCanvases: [],
  pdfBytes: null,
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

// Drop zone events
dropZone.addEventListener('click', e => {
  // Avoid double-triggering the picker when the click originated on
  // the (hidden) file input itself.
  if (e.target === fileInput) return;
  fileInput.click();
});
fileInput.addEventListener('click', e => e.stopPropagation());
dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', e => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  handleFiles(e.dataTransfer.files);
});
fileInput.addEventListener('change', e => handleFiles(e.target.files));

async function handleFiles(files) {
  if (!files.length) return;
  showLoading('Loading files...');

  state.pages = [];
  state.pageImages = [];
  state.outputCanvases = [];
  state.pdfBytes = null;
  pageThumbs.innerHTML = '';
  fileList.innerHTML = '';

  const fileArr = Array.from(files);
  const isPDF = fileArr.length === 1 && fileArr[0].type === 'application/pdf';

  if (isPDF) {
    await loadPDF(fileArr[0]);
  } else {
    const imageFiles = fileArr.filter(f => f.type.startsWith('image/'));
    // Sort by name
    imageFiles.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    for (const f of imageFiles) {
      await loadImage(f);
    }
  }

  // Show file info
  if (isPDF) {
    addFileInfo(fileArr[0].name, state.pages.length + ' pages');
  } else {
    addFileInfo(fileArr.length + ' images', state.pages.length + ' pages');
  }

  // Show thumbnails
  renderThumbs();
  downloadBtn.disabled = state.pages.length === 0;
  hideLoading();
  updatePreview();
}

async function loadPDF(file) {
  const arrayBuf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise;

  for (let i = 1; i <= pdf.numPages; i++) {
    loadingText.textContent = `Extracting page ${i}/${pdf.numPages}...`;
    const page = await pdf.getPage(i);
    const vp = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = vp.width;
    canvas.height = vp.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport: vp }).promise;
    state.pages.push({ canvas, width: vp.width, height: vp.height });
  }
}

async function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      state.pages.push({ canvas, width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(img.src);
      resolve();
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function addFileInfo(name, detail) {
  fileList.innerHTML = `
    <div class="file-info">
      <span class="name">${name}</span>
      <span class="page-count-badge">${detail}</span>
      <button class="remove" onclick="clearPages()">✕ Clear</button>
    </div>`;
}

function clearPages() {
  state.pages = [];
  state.pageImages = [];
  state.outputCanvases = [];
  state.pdfBytes = null;
  fileList.innerHTML = '';
  pageThumbs.innerHTML = '';
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
