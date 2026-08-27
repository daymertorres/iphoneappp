import { getDb } from "./_lib/firebase-admin.js";

function isAuthorized(req) {
  const adminKey = req.headers["x-admin-key"];
  return adminKey && adminKey === process.env.ADMIN_PANEL_KEY;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  if (!isAuthorized(req)) {
    return res.status(401).json({ error: "No autorizado." });
  }

  try {
    const { licenseKey } = req.body ?? {};

    if (!licenseKey) {
      return res.status(400).json({ error: "Falta licenseKey." });
    }

    const db = getDb();
    const ref = db.collection("licenses").doc(licenseKey);
    const snap = await ref.get();

    if (snap.exists) {
      return res.status(409).json({ error: "La licencia ya existe." });
    }

    await ref.set({
      used: false,
      blocked: false,
      boundDeviceId: "",
      activatedAt: null
    });

    return res.status(200).json({
      ok: true,
      licenseKey
    });
  } catch (error) {
    console.error("CREATE LICENSE ERROR:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
