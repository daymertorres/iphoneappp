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
    const { licenseKey, used, blocked, boundDeviceId } = req.body ?? {};

    if (!licenseKey) {
      return res.status(400).json({ error: "Falta licenseKey." });
    }

    const db = getDb();
    const ref = db.collection("licenses").doc(licenseKey);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Licencia no encontrada." });
    }

    const current = snap.data();
    const nextBoundDeviceId =
      typeof boundDeviceId === "string" ? boundDeviceId.trim() : "";

    await ref.update({
      used: !!used,
      blocked: !!blocked,
      boundDeviceId: nextBoundDeviceId,
      activatedAt: nextBoundDeviceId
        ? current.activatedAt || new Date().toISOString()
        : null
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("UPDATE LICENSE ERROR:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
