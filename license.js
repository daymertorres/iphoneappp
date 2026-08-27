// ── Configuración ──────────────────────────────────────────────
const SEG_COUNT  = 4;   // cantidad de grupos
const SEG_LENGTH = 4;   // caracteres por grupo
const MAX_LENGTH = SEG_COUNT * SEG_LENGTH; // 16 en total

const inputs     = Array.from({ length: SEG_COUNT }, (_, i) => document.getElementById(`seg${i}`));
const activateBtn = document.getElementById("activateBtn");
const msg         = document.getElementById("licenseMsg");

// ── Utilidades ─────────────────────────────────────────────────
function getOrCreateDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("device_id", id);
  }
  return id;
}

/** Devuelve el valor raw (sin guiones) de todos los segmentos */
function getRaw() {
  return inputs.map(i => i.value.toUpperCase()).join("");
}

/** Formatea XXXXXXXXXXXXXXXX → XXXX-XXXX-XXXX-XXXX */
function formatKey(raw) {
  return raw.match(/.{1,4}/g)?.join("-") ?? raw;
}

/** Actualiza estilos de cada campo y habilita/deshabilita el botón */
function refreshState() {
  const raw = getRaw();
  inputs.forEach(inp => {
    inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    inp.classList.toggle("filled", inp.value.length === SEG_LENGTH);
  });
  activateBtn.disabled = raw.length !== MAX_LENGTH;
}

// ── Distribución automática al escribir ────────────────────────
inputs.forEach((inp, idx) => {
  inp.addEventListener("input", () => {
    // Solo letras y números, mayúsculas
    inp.value = inp.value.toUpperCase().replace(/[^A-Z0-9]/g, "");

    if (inp.value.length >= SEG_LENGTH && idx < SEG_COUNT - 1) {
      // Pasar al siguiente campo
      inputs[idx + 1].focus();
    }

    refreshState();
    msg.textContent = "";
  });

  // Backspace en campo vacío → ir al anterior
  inp.addEventListener("keydown", (e) => {
    if (e.key === "Backspace" && inp.value === "" && idx > 0) {
      inputs[idx - 1].focus();
    }
  });

  // ── Pegado inteligente ──────────────────────────────────────
  inp.addEventListener("paste", (e) => {
    e.preventDefault();
    const pasted = (e.clipboardData || window.clipboardData)
      .getData("text")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, ""); // quitar guiones, espacios, etc.

    if (!pasted) return;

    // Repartir los caracteres entre los 4 campos
    let cursor = 0;
    inputs.forEach((field, fi) => {
      const chunk = pasted.slice(cursor, cursor + SEG_LENGTH);
      field.value = chunk;
      field.classList.toggle("filled", chunk.length === SEG_LENGTH);
      // Animación de flash
      field.classList.remove("pasted");
      requestAnimationFrame(() => field.classList.add("pasted"));
      cursor += SEG_LENGTH;
    });

    // Foco al último campo con datos (o el primero vacío)
    const focusIdx = Math.min(
      Math.ceil(pasted.length / SEG_LENGTH),
      SEG_COUNT - 1
    );
    inputs[focusIdx].focus();

    refreshState();
    msg.textContent = "";
  });
});

// ── Activar licencia ───────────────────────────────────────────
async function activateLicense() {
  const raw = getRaw();
  if (raw.length !== MAX_LENGTH) {
    showMsg("Completa los 4 grupos de la licencia.", false);
    return;
  }

  const licenseKey = formatKey(raw);
  const deviceId   = getOrCreateDeviceId();

  activateBtn.disabled  = true;
  activateBtn.textContent = "Activando…";
  msg.textContent = "";

  try {
    const res  = await fetch("/api/activate-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, deviceId })
    });
    const data = await res.json();

    if (!res.ok) {
      showMsg(data.error || "Licencia inválida o ya en uso.", false);
      return;
    }

    localStorage.setItem("device_id", deviceId);
    localStorage.setItem("license_key", licenseKey);
    localStorage.setItem("license_activated", "true");

    showMsg("✓ Licencia activada", true);
    setTimeout(() => window.location.replace("/index.html"), 700);

  } catch {
    showMsg("Sin conexión. Verifica tu internet.", false);
  } finally {
    activateBtn.disabled    = false;
    activateBtn.textContent = "Activar";
  }
}

function showMsg(text, success = false) {
  msg.textContent = text;
  msg.className   = "license-msg" + (success ? " success" : "");
}

activateBtn.addEventListener("click", activateLicense);

// ── Comprobación de acceso existente ──────────────────────────
async function checkExistingAccess() {
  const licenseKey = localStorage.getItem("license_key");
  const deviceId   = localStorage.getItem("device_id");
  const activated  = localStorage.getItem("license_activated");

  if (!licenseKey || !deviceId || !activated) return;

  // Sin internet: ir directo al app
  if (!navigator.onLine) {
    window.location.replace("/index.html");
    return;
  }

  try {
    const res = await fetch("/api/check-license", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ licenseKey, deviceId })
    });

    if (res.ok) {
      window.location.replace("/index.html");
      return;
    }

    // Licencia revocada en servidor
    localStorage.removeItem("license_key");
    localStorage.removeItem("license_activated");
  } catch {
    // Error de red: ya tiene credenciales, dejar pasar
    window.location.replace("/index.html");
  }
}

checkExistingAccess();
refreshState();
