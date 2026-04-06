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
    console.log("LICENSE KEY RECEIVED:", licenseKey);
    console.log("DEVICE ID RECEIVED:", deviceId);

    const ref = db.collection("licenses").doc(licenseKey);
    const snap = await ref.get();

    console.log("DOC EXISTS:", snap.exists);
    if (snap.exists) {
      console.log("DOC DATA:", snap.data());
    }

    if (!snap.exists) {
      return res.status(404).json({ error: "Licencia inválida." });
    }

    const data = snap.data();

    if (data.blocked === true) {
      return res.status(403).json({ error: "Licencia bloqueada." });
    }

    if (!data.boundDeviceId) {
      await ref.update({
        boundDeviceId: deviceId,
        activatedAt: new Date().toISOString(),
        used: true
      });

      return res.status(200).json({
        ok: true,
        message: "Licencia activada correctamente."
      });
    }

    if (data.boundDeviceId !== deviceId) {
      return res.status(403).json({
        error: "Esta licencia ya fue activada en otro dispositivo."
      });
    }

    return res.status(200).json({
      ok: true,
      message: "Licencia válida para este dispositivo."
    });
  } catch (error) {
    console.error("ACTIVATE LICENSE ERROR:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
