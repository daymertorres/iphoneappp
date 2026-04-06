function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }

  return deviceId;
}

const form = document.getElementById("licenseForm");
const input = document.getElementById("licenseInput");
const focusBtn = document.getElementById("focusBtn");
const btn = document.getElementById("activateBtn");
const msg = document.getElementById("licenseMsg");

async function checkExistingAccess() {
  const licenseKey = localStorage.getItem("license_key");
  const deviceId = localStorage.getItem("device_id");
  const activated = localStorage.getItem("license_activated");

  if (!licenseKey || !deviceId || !activated) return;

  try {
    const res = await fetch("/api/check-license", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ licenseKey, deviceId })
    });

    if (res.ok) {
      window.location.replace("/index.html");
      return;
    }

    localStorage.removeItem("license_key");
    localStorage.removeItem("license_activated");
  } catch (error) {
    console.error("CHECK EXISTING ACCESS ERROR:", error);
  }
}

function unlockInputAndFocus() {
  input.readOnly = false;

  // Importante: esto debe ejecutarse por toque/click del usuario
  input.focus();
  input.click();

  const end = input.value.length;
  try {
    input.setSelectionRange(end, end);
  } catch (error) {
    // Algunos navegadores no lo permiten en ciertos estados
  }
}

function setupIOSInputFix() {
  // El input inicia readonly para evitar bugs de enfoque en iPhone PWA.
  // Al tocarlo o tocar el botón, lo desbloqueamos y enfocamos manualmente.

  focusBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    unlockInputAndFocus();
  });

  focusBtn.addEventListener("click", (e) => {
    e.preventDefault();
    unlockInputAndFocus();
  });

  input.addEventListener("touchend", (e) => {
    e.preventDefault();
    unlockInputAndFocus();
  });

  input.addEventListener("click", () => {
    unlockInputAndFocus();
  });

  // Si la página vuelve desde caché del navegador/PWA
  window.addEventListener("pageshow", () => {
    setTimeout(() => {
      input.blur();
    }, 30);
  });
}

function normalizeLicenseValue(value) {
  return value
    .toUpperCase()
    .replace(/\s+/g, "")
    .trim();
}

async function activateLicense() {
  const licenseKey = normalizeLicenseValue(input.value);
  const deviceId = getOrCreateDeviceId();

  msg.textContent = "";

  if (!licenseKey) {
    msg.textContent = "Ingresa una licencia válida.";
    return;
  }

  btn.disabled = true;
  focusBtn.disabled = true;
  btn.textContent = "Activando...";

  try {
    const res = await fetch("/api/activate-license", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ licenseKey, deviceId })
    });

    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || "No se pudo activar la licencia.";
      return;
    }

    localStorage.setItem("device_id", deviceId);
    localStorage.setItem("license_key", licenseKey);
    localStorage.setItem("license_activated", "true");

    window.location.replace("/index.html");
  } catch (error) {
    console.error("ACTIVATE LICENSE FRONTEND ERROR:", error);
    msg.textContent = "Error de conexión. Intenta otra vez.";
  } finally {
    btn.disabled = false;
    focusBtn.disabled = false;
    btn.textContent = "Activar";
  }
}

checkExistingAccess();
setupIOSInputFix();

form.addEventListener("submit", (e) => {
  e.preventDefault();
  activateLicense();
});

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    activateLicense();
  }
});

input.addEventListener("input", () => {
  input.value = input.value.toUpperCase();
});
