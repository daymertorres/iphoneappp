const display = document.getElementById("display");
const keys = document.querySelectorAll(".key");
const deleteBtn = document.getElementById("deleteBtn");
const callBtn = document.getElementById("callBtn");

const infoOverlay = document.getElementById("infoOverlay");
const closeInfoBtn = document.getElementById("closeInfoBtn");

const eidValue = document.getElementById("eidValue");
const imei1Value = document.getElementById("imei1Value");
const imei2Value = document.getElementById("imei2Value");

const deviceInfo = {
  eid: "92150143118420994822300208643383",
  imei1: "358470101769662",
  imei2: "356949112249204"
};

let entered = "";

function updateDisplay() {
  display.textContent = entered || "\u00A0";
}

function drawBarcode(selector, value) {
  if (typeof JsBarcode === "undefined") {
    console.error("JsBarcode no está cargado.");
    return;
  }

  JsBarcode(selector, value, {
    format: "CODE128",
    lineColor: "#000000",
    background: "#ffffff",
    width: 1.4,
    height: 58,
    displayValue: false,
    margin: 8
  });
}

function openInfoSheet() {
  eidValue.textContent = deviceInfo.eid;
  imei1Value.textContent = `IMEI ${deviceInfo.imei1}`;
  imei2Value.textContent = `IMEI2 ${deviceInfo.imei2}`;

  infoOverlay.classList.remove("hidden");

  setTimeout(() => {
    drawBarcode("#eidBarcode", deviceInfo.eid);
    drawBarcode("#imei1Barcode", deviceInfo.imei1);
    drawBarcode("#imei2Barcode", deviceInfo.imei2);
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

let deleteHoldTimer = null;
let deleteRepeatTimer = null;
let deleteHoldTriggered = false;

deleteBtn.addEventListener("pointerdown", startDeletePress);
deleteBtn.addEventListener("pointerup", endDeletePress);
deleteBtn.addEventListener("pointerleave", endDeletePress);
deleteBtn.addEventListener("pointercancel", endDeletePress);

function startDeletePress(e) {
  e.preventDefault();

  if (!entered.length) return;

  deleteHoldTriggered = false;

  deleteHoldTimer = setTimeout(() => {
    deleteHoldTriggered = true;

    deleteRepeatTimer = setInterval(() => {
      if (!entered.length) {
        clearInterval(deleteRepeatTimer);
        deleteRepeatTimer = null;
        return;
      }

      entered = entered.slice(0, -1);
      updateDisplay();
    }, 70);
  }, 420);
}

function endDeletePress(e) {
  e.preventDefault();

  if (deleteHoldTimer) {
    clearTimeout(deleteHoldTimer);
    deleteHoldTimer = null;
  }

  if (deleteRepeatTimer) {
    clearInterval(deleteRepeatTimer);
    deleteRepeatTimer = null;
  }

  if (!deleteHoldTriggered && entered.length) {
    entered = entered.slice(0, -1);
    updateDisplay();
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
    drawBarcode("#eidBarcode", deviceInfo.eid);
    drawBarcode("#imei1Barcode", deviceInfo.imei1);
    drawBarcode("#imei2Barcode", deviceInfo.imei2);
  }
});

updateDisplay();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
