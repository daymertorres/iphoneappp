import { getDb } from "./_lib/firebase-admin.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    const { licenseKey, deviceId } = req.body ?? {};

    if (!licenseKey || !deviceId) {
      return res.status(400).json({ error: "Faltan datos." });
    }

    const db = getDb();
    const ref = db.collection("licenses").doc(licenseKey);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "Licencia inválida." });
    }

    const data = snap.data();

    if (data.blocked === true) {
      return res.status(403).json({ error: "Licencia bloqueada." });
    }

    if (data.boundDeviceId !== deviceId) {
      return res.status(403).json({
        error: "Este dispositivo no está autorizado."
      });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}