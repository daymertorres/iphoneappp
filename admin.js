const loginBox = document.getElementById("loginBox");
const adminApp = document.getElementById("adminApp");

const adminUserInput = document.getElementById("adminUserInput");
const adminPassInput = document.getElementById("adminPassInput");
const loginBtn = document.getElementById("loginBtn");
const loginMsg = document.getElementById("loginMsg");
const logoutBtn = document.getElementById("logoutBtn");

const createLicenseBtn = document.getElementById("createLicenseBtn");
const generatedLicense = document.getElementById("generatedLicense");
const copyLicenseBtn = document.getElementById("copyLicenseBtn");
const searchInput = document.getElementById("searchInput");
const refreshBtn = document.getElementById("refreshBtn");
const statusMsg = document.getElementById("statusMsg");
const licensesTableBody = document.getElementById("licensesTableBody");

let allLicenses = [];

function setStatus(message, isError = false) {
  statusMsg.textContent = message;
  statusMsg.style.color = isError ? "#ff7b7b" : "#8fd18f";
}

function setLoginStatus(message, isError = false) {
  loginMsg.textContent = message;
  loginMsg.style.color = isError ? "#ff7b7b" : "#8fd18f";
}

function generateLicenseKey() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const groups = [4, 4, 4, 4];

  return groups
    .map((size) => {
      let part = "";
      for (let i = 0; i < size; i++) {
        part += chars[Math.floor(Math.random() * chars.length)];
      }
      return part;
    })
    .join("-");
}

function getAdminToken() {
  return sessionStorage.getItem("admin_panel_key") || "";
}

function isLoggedIn() {
  return !!getAdminToken();
}

function showPanel() {
  loginBox.classList.add("hidden");
  adminApp.classList.remove("hidden");
}

function showLogin() {
  adminApp.classList.add("hidden");
  loginBox.classList.remove("hidden");
}

async function apiPost(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-admin-key": getAdminToken()
    },
    body: JSON.stringify(body || {})
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error en la petición");
  }

  return data;
}

function renderLicenses(items) {
  licensesTableBody.innerHTML = "";

  if (!items.length) {
    licensesTableBody.innerHTML = `
      <tr>
        <td colspan="6">No hay licencias.</td>
      </tr>
    `;
    return;
  }

  items.forEach((item) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.key}</td>
      <td>
        <input class="toggle used-toggle" type="checkbox" ${item.used ? "checked" : ""} />
      </td>
      <td>
        <input class="toggle blocked-toggle" type="checkbox" ${item.blocked ? "checked" : ""} />
      </td>
      <td>
        <input class="small-input device-input" type="text" value="${item.boundDeviceId || ""}" />
      </td>
      <td>${item.activatedAt || "-"}</td>
      <td>
        <button class="save-btn" type="button">Guardar</button>
      </td>
    `;

    const usedToggle = tr.querySelector(".used-toggle");
    const blockedToggle = tr.querySelector(".blocked-toggle");
    const deviceInput = tr.querySelector(".device-input");
    const saveBtn = tr.querySelector(".save-btn");

    saveBtn.addEventListener("click", async () => {
      try {
        saveBtn.disabled = true;

        await apiPost("/api/update-license", {
          licenseKey: item.key,
          used: usedToggle.checked,
          blocked: blockedToggle.checked,
          boundDeviceId: deviceInput.value.trim()
        });

        setStatus(`Licencia ${item.key} actualizada.`);
        await loadLicenses();
      } catch (error) {
        setStatus(error.message, true);
      } finally {
        saveBtn.disabled = false;
      }
    });

    licensesTableBody.appendChild(tr);
  });
}

function filterAndRender() {
  const term = searchInput.value.trim().toUpperCase();

  if (!term) {
    renderLicenses(allLicenses);
    return;
  }

  renderLicenses(allLicenses.filter((item) => item.key.includes(term)));
}

async function loadLicenses() {
  try {
    const data = await apiPost("/api/list-licenses", {});
    allLicenses = data.licenses || [];
    filterAndRender();
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loginAdmin() {
  const username = adminUserInput.value.trim();
  const password = adminPassInput.value.trim();

  setLoginStatus("");

  if (!username || !password) {
    setLoginStatus("Ingresa usuario y contraseña.", true);
    return;
  }

  loginBtn.disabled = true;
  loginBtn.textContent = "Entrando...";

  try {
    const res = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!res.ok) {
      setLoginStatus(data.error || "Credenciales inválidas.", true);
      return;
    }

    sessionStorage.setItem("admin_panel_key", data.adminKey);
    showPanel();
    setStatus("Sesión iniciada correctamente.");
    await loadLicenses();
  } catch (error) {
    setLoginStatus("Error de conexión.", true);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = "Entrar";
  }
}

function logoutAdmin() {
  sessionStorage.removeItem("admin_panel_key");
  showLogin();
  allLicenses = [];
  licensesTableBody.innerHTML = "";
  generatedLicense.textContent = "----";
  setStatus("");
  setLoginStatus("");
}

loginBtn.addEventListener("click", loginAdmin);
adminPassInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginAdmin();
});

logoutBtn.addEventListener("click", logoutAdmin);

createLicenseBtn.addEventListener("click", async () => {
  try {
    const licenseKey = generateLicenseKey();

    await apiPost("/api/create-license", { licenseKey });

    generatedLicense.textContent = licenseKey;
    setStatus("Licencia creada correctamente.");
    await loadLicenses();
  } catch (error) {
    setStatus(error.message, true);
  }
});

copyLicenseBtn.addEventListener("click", async () => {
  const value = generatedLicense.textContent.trim();

  if (!value || value === "----") {
    setStatus("No hay licencia para copiar.", true);
    return;
  }

  try {
    await navigator.clipboard.writeText(value);
    setStatus("Licencia copiada.");
  } catch {
    setStatus("No se pudo copiar.", true);
  }
});

refreshBtn.addEventListener("click", loadLicenses);
searchInput.addEventListener("input", filterAndRender);

if (isLoggedIn()) {
  showPanel();
  loadLicenses();
} else {
  showLogin();
}
