(async function () {
  const PUBLIC_PAGES = ["/license.html"];

  const currentPath = window.location.pathname;
  if (PUBLIC_PAGES.includes(currentPath)) return;

  const licenseKey = localStorage.getItem("license_key");
  const deviceId = localStorage.getItem("device_id");
  const activated = localStorage.getItem("license_activated");

  if (!licenseKey || !deviceId || !activated) {
    window.location.replace("/license.html");
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
    localStorage.removeItem("license_key");
    localStorage.removeItem("license_activated");
    window.location.replace("/license.html");
  }
})();