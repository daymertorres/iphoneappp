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

    console.log("PROJECT ID:", process.env.FIREBASE_PROJECT_ID);
    console.log("CLIENT EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
    console.log("CHECK LICENSE KEY:", licenseKey);
    console.log("CHECK DEVICE ID:", deviceId);

    const ref = db.collection("licenses").doc(licenseKey);
    const snap = await ref.get();

    console.log("CHECK DOC EXISTS:", snap.exists);

    if (!snap.exists) {
      return res.status(404).json({ error: "Licencia inválida." });
    }

    const data = snap.data();

    console.log("CHECK DOC DATA:", data);

    if (data.blocked === true) {
      return res.status(403).json({ error: "Licencia bloqueada." });
    }

    const rawBoundDeviceId = typeof data.boundDeviceId === "string"
      ? data.boundDeviceId.trim()
      : "";

    const normalizedBoundDeviceId =
      rawBoundDeviceId === "" || rawBoundDeviceId === '""'
        ? ""
        : rawBoundDeviceId;

    if (!normalizedBoundDeviceId) {
      return res.status(403).json({
        error: "La licencia aún no ha sido activada."
      });
    }

    if (normalizedBoundDeviceId !== deviceId) {
      return res.status(403).json({
        error: "Este dispositivo no está autorizado."
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Licencia válida para este dispositivo."
    });
  } catch (error) {
    console.error("CHECK LICENSE ERROR:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
