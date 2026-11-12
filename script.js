// ---------- Canvas setup ----------
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 500;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// White background so the eraser and exported PNG look correct
ctx.fillStyle = "#ffffff";
ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

// ---------- State ----------
let isDrawing = false;
let currentColor = "#1f1f1f";
let isEraser = false;
let brushSize = 5;

const history = [];        // snapshots for Undo
const MAX_HISTORY = 20;

// ---------- DOM references ----------
const swatchBox   = document.getElementById("colors");
const colorPicker = document.getElementById("color-picker");
const sizeSlider  = document.getElementById("size");
const sizeLabel   = document.getElementById("size-label");
const eraserBtn   = document.getElementById("eraser");
const undoBtn     = document.getElementById("undo");
const clearBtn    = document.getElementById("clear");
const saveBtn     = document.getElementById("save");

// ---------- Color swatches ----------
const palette = ["#1f1f1f", "#e63946", "#f4a261", "#ffd166",
                 "#2a9d8f", "#457b9d", "#8338ec", "#ff006e"];

palette.forEach(color => {
  const btn = document.createElement("button");
  btn.className = "swatch";
  btn.style.background = color;
  btn.addEventListener("click", () => selectColor(color, btn));
  swatchBox.appendChild(btn);
});

function selectColor(color, btn) {
  currentColor = color;
  isEraser = false;
  eraserBtn.classList.remove("active");
  document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
  btn.classList.add("active");
}
document.querySelector(".swatch").classList.add("active"); // highlight first swatch

// ---------- Drawing helpers ----------
// Convert pointer position → canvas coordinates
// (scales correctly when canvas is displayed smaller/larger than 900x500)
function getPosition(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - rect.left) * (canvas.width / rect.width),
    y: (e.clientY - rect.top) * (canvas.height / rect.height)
  };
}

function applyBrushStyle() {
  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = isEraser ? "#ffffff" : currentColor;
}

// ---------- Pointer events (mouse + touch) ----------
canvas.addEventListener("pointerdown", e => {
  isDrawing = true;
  canvas.setPointerCapture(e.pointerId);
  saveState();                       // snapshot before every stroke → enables Undo

  const pos = getPosition(e);
  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
  ctx.lineTo(pos.x + 0.1, pos.y);    // tiny line so a single click leaves a dot
  applyBrushStyle();
  ctx.stroke();
});

canvas.addEventListener("pointermove", e => {
  if (!isDrawing) return;
  const pos = getPosition(e);
  applyBrushStyle();
  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();
});

canvas.addEventListener("pointerup",   () => (isDrawing = false));
canvas.addEventListener("pointerleave",() => (isDrawing = false));

// ---------- Undo / Clear / Save ----------
function saveState() {
  history.push(canvas.toDataURL());
  if (history.length > MAX_HISTORY) history.shift();
}

undoBtn.addEventListener("click", () => {
  if (history.length === 0) return;
  const snapshot = history.pop();
  const img = new Image();
  img.onload = () => {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
  };
  img.src = snapshot;
});

clearBtn.addEventListener("click", () => {
  saveState();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
});

saveBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "my-sketch.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

// ---------- Toolbar controls ----------
colorPicker.addEventListener("input", e => {
  currentColor = e.target.value;
  isEraser = false;
  eraserBtn.classList.remove("active");
  document.querySelectorAll(".swatch").forEach(s => s.classList.remove("active"));
});

sizeSlider.addEventListener("input", e => {
  brushSize = Number(e.target.value);
  sizeLabel.textContent = brushSize + "px";
});

eraserBtn.addEventListener("click", () => {
  isEraser = !isEraser;
  eraserBtn.classList.toggle("active", isEraser);
});