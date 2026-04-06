function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }

  return deviceId;
}

const input = document.getElementById("licenseInput");
const btn = document.getElementById("activateBtn");
const msg = document.getElementById("licenseMsg");

function isStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
}

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

function setupIOSInputFix() {
  if (!input) return;

  const forceFocus = () => {
    setTimeout(() => {
      input.focus();
      input.click();
      const end = input.value.length;
      try {
        input.setSelectionRange(end, end);
      } catch (e) {}
    }, 60);
  };

  input.addEventListener("touchstart", forceFocus);
  input.addEventListener("touchend", forceFocus);
  input.addEventListener("click", forceFocus);

  window.addEventListener("pageshow", () => {
    setTimeout(() => {
      input.blur();
    }, 50);
  });
}

function normalizeLicenseValue(value) {
  return value.toUpperCase().trim();
}

function blockActivationOutsideStandalone() {
  if (isStandaloneMode()) return false;

  input.disabled = true;
  btn.disabled = true;
  msg.textContent = "Primero añade la app a pantalla de inicio y ábrela desde ahí para activar la licencia.";
  return true;
}

async function activateLicense() {
  if (!isStandaloneMode()) {
    msg.textContent = "Abre esta app desde la pantalla de inicio para activar la licencia.";
    return;
  }

  const licenseKey = normalizeLicenseValue(input.value);
  const deviceId = getOrCreateDeviceId();

  msg.textContent = "";

  if (!licenseKey) {
    msg.textContent = "Ingresa una licencia válida.";
    return;
  }

  btn.disabled = true;
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
    btn.textContent = "Activar";
  }
}

checkExistingAccess();
setupIOSInputFix();

const blocked = blockActivationOutsideStandalone();

if (!blocked) {
  btn.addEventListener("click", activateLicense);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      activateLicense();
    }
  });

  input.addEventListener("input", () => {
    input.value = input.value.toUpperCase();
  });
}
