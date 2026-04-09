export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido." });
  }

  try {
    const { username, password } = req.body ?? {};

    if (!username || !password) {
      return res.status(400).json({ error: "Faltan credenciales." });
    }

    const validUser = process.env.ADMIN_USERNAME;
    const validPass = process.env.ADMIN_PASSWORD;
    const adminKey = process.env.ADMIN_PANEL_KEY;

    if (!validUser || !validPass || !adminKey) {
      return res.status(500).json({ error: "Faltan variables de entorno del panel admin." });
    }

    if (username !== validUser || password !== validPass) {
      return res.status(401).json({ error: "Usuario o contraseña incorrectos." });
    }

    return res.status(200).json({
      ok: true,
      adminKey
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
}
