const display = document.getElementById("display");
const keys = document.querySelectorAll(".key");
const deleteBtn = document.getElementById("deleteBtn");
const callBtn = document.getElementById("callBtn");

const infoOverlay = document.getElementById("infoOverlay");
const closeInfoBtn = document.getElementById("closeInfoBtn");

const eidValue = document.getElementById("eidValue");
const imei1Value = document.getElementById("imei1Value");
const imei2Value = document.getElementById("imei2Value");

const eidBarcode = document.getElementById("eidBarcode");
const imei1Barcode = document.getElementById("imei1Barcode");
const imei2Barcode = document.getElementById("imei2Barcode");

const deviceInfo = {
  eid: "89049032007208882600188086421161",
  imei1: "359626458246633",
  imei2: "359626458239075"
};

let entered = "";

function updateDisplay() {
  display.textContent = entered || "\u00A0";
}

function generatePatternFromText(text) {
  const digits = String(text).replace(/\D/g, "");
  let bits = "";

  for (let i = 0; i < digits.length; i++) {
    const n = Number(digits[i]);
    const width = (n % 4) + 1;
    bits += "1".repeat(width);
    bits += "0".repeat(((n + 1) % 3) + 1);
  }

  bits = "1010" + bits + "110101";
  return bits;
}

function drawBarcode(container, text) {
  container.innerHTML = "";

  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;

  const width = container.clientWidth || 320;
  const height = container.clientHeight || 80;

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);

  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  const pattern = generatePatternFromText(text);
  const quietZone = 18;
  const usableWidth = width - quietZone * 2;
  const barWidth = Math.max(1, usableWidth / pattern.length);

  let x = quietZone;

  for (let i = 0; i < pattern.length; i++) {
    if (pattern[i] === "1") {
      ctx.fillStyle = "#000000";
      ctx.fillRect(x, 8, Math.max(1, barWidth), height - 16);
    }
    x += barWidth;
  }

  container.appendChild(canvas);
}

function openInfoSheet() {
  eidValue.textContent = deviceInfo.eid;
  imei1Value.textContent = `IMEI ${deviceInfo.imei1}`;
  imei2Value.textContent = `IMEI2 ${deviceInfo.imei2}`;

  infoOverlay.classList.remove("hidden");

  setTimeout(() => {
    drawBarcode(eidBarcode, deviceInfo.eid);
    drawBarcode(imei1Barcode, deviceInfo.imei1);
    drawBarcode(imei2Barcode, deviceInfo.imei2);
  }, 20);
}

function closeInfoSheet() {
  infoOverlay.classList.add("hidden");
}

function checkSpecialCode() {
  if (entered === "*#06#") {
    openInfoSheet();
  }
}

keys.forEach((key) => {
  key.addEventListener("click", () => {
    const value = key.dataset.value;
    entered += value;
    updateDisplay();
    checkSpecialCode();
  });
});

deleteBtn.addEventListener("click", () => {
  entered = entered.slice(0, -1);
  updateDisplay();
});

deleteBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
}, { passive: false });

let deletePressTimer = null;

deleteBtn.addEventListener("mousedown", startDeleteHold);
deleteBtn.addEventListener("touchstart", startDeleteHold, { passive: true });
deleteBtn.addEventListener("mouseup", stopDeleteHold);
deleteBtn.addEventListener("mouseleave", stopDeleteHold);
deleteBtn.addEventListener("touchend", stopDeleteHold);

function startDeleteHold() {
  deletePressTimer = setTimeout(() => {
    entered = "";
    updateDisplay();
  }, 700);
}

function stopDeleteHold() {
  if (deletePressTimer) {
    clearTimeout(deletePressTimer);
    deletePressTimer = null;
  }
}

callBtn.addEventListener("click", () => {
  if (entered === "*#06#") {
    openInfoSheet();
    return;
  }

  if (!entered.trim()) return;

  window.location.href = `tel:${entered}`;
});

closeInfoBtn.addEventListener("click", closeInfoSheet);

infoOverlay.addEventListener("click", (e) => {
  if (e.target === infoOverlay) {
    closeInfoSheet();
  }
});

window.addEventListener("resize", () => {
  if (!infoOverlay.classList.contains("hidden")) {
    drawBarcode(eidBarcode, deviceInfo.eid);
    drawBarcode(imei1Barcode, deviceInfo.imei1);
    drawBarcode(imei2Barcode, deviceInfo.imei2);
  }
});

updateDisplay();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
