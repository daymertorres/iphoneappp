const LICENSE_GROUPS = [4, 4, 4, 4];
const MAX_LICENSE_LENGTH = LICENSE_GROUPS.reduce((a, b) => a + b, 0);

const display = document.getElementById("licenseDisplay");
const keys = document.querySelectorAll(".license-key");
const deleteBtn = document.getElementById("deleteBtn");
const clearBtn = document.getElementById("clearBtn");
const activateBtn = document.getElementById("activateBtn");
const msg = document.getElementById("licenseMsg");

let rawLicense = "";

function getOrCreateDeviceId() {
  let deviceId = localStorage.getItem("device_id");

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem("device_id", deviceId);
  }

  return deviceId;
}

function formatLicense(value) {
  let cursor = 0;
  const parts = [];

  for (const size of LICENSE_GROUPS) {
    const chunk = value.slice(cursor, cursor + size);
    if (!chunk) break;
    parts.push(chunk);
    cursor += size;
  }

  return parts.join("-");
}

function updateDisplay() {
  display.textContent = rawLicense ? formatLicense(rawLicense) : "----";
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

async function activateLicense() {
  const licenseKey = formatLicense(rawLicense);
  const deviceId = getOrCreateDeviceId();

  msg.textContent = "";

  if (rawLicense.length !== MAX_LICENSE_LENGTH) {
    msg.textContent = "Completa la licencia antes de activar.";
    return;
  }

  activateBtn.disabled = true;
  deleteBtn.disabled = true;
  clearBtn.disabled = true;
  activateBtn.textContent = "Activando...";

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
    activateBtn.disabled = false;
    deleteBtn.disabled = false;
    clearBtn.disabled = false;
    activateBtn.textContent = "Activar";
  }
}

keys.forEach((key) => {
  key.addEventListener("click", () => {
    if (rawLicense.length >= MAX_LICENSE_LENGTH) return;
    rawLicense += key.dataset.value;
    updateDisplay();
    msg.textContent = "";
  });
});

deleteBtn.addEventListener("click", () => {
  rawLicense = rawLicense.slice(0, -1);
  updateDisplay();
});

clearBtn.addEventListener("click", () => {
  rawLicense = "";
  updateDisplay();
  msg.textContent = "";
});

activateBtn.addEventListener("click", activateLicense);

checkExistingAccess();
updateDisplay();
