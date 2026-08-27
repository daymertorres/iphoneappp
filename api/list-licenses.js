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
    const db = getDb();
    const snap = await db.collection("licenses").get();

    const licenses = snap.docs.map((doc) => ({
      key: doc.id,
      ...doc.data()
    }));

    licenses.sort((a, b) => a.key.localeCompare(b.key));

    return res.status(200).json({
      ok: true,
      licenses
    });
  } catch (error) {
    console.error("LIST LICENSES ERROR:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
