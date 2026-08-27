(async function () {
  const currentPath = window.location.pathname;

  if (currentPath.endsWith("/license.html")) {
    return;
  }

  const licenseKey = localStorage.getItem("license_key");
  const deviceId = localStorage.getItem("device_id");
  const activated = localStorage.getItem("license_activated");

  // Si no hay credenciales guardadas, pedir clave
  if (!licenseKey || !deviceId || !activated) {
    window.location.replace("/license.html");
    return;
  }

  // Si no hay internet, usar las credenciales guardadas (modo offline)
  if (!navigator.onLine) {
    console.log("Modo offline: usando licencia almacenada localmente.");
    return;
  }

  try {
    const res = await fetch("/api/check-license", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ licenseKey, deviceId })
    });

    if (!res.ok) {
      localStorage.removeItem("license_key");
      localStorage.removeItem("license_activated");
      window.location.replace("/license.html");
    }
  } catch (error) {
    // Error de red (sin internet): permitir acceso con credenciales guardadas
    if (error instanceof TypeError && licenseKey && activated) {
      console.log("Sin conexión: accediendo con licencia local.");
      return;
    }
    // Otro tipo de error: revocar acceso
    console.error("AUTH GUARD ERROR:", error);
    localStorage.removeItem("license_key");
    localStorage.removeItem("license_activated");
    window.location.replace("/license.html");
  }
})();

