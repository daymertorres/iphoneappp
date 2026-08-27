# Teléfono estilo iPhone - Web App

Proyecto universitario hecho con **HTML, CSS y JavaScript** que simula el teclado de la app Teléfono de iPhone.

## Funciones
- Interfaz visual estilo iPhone.
- Teclado numérico con letras.
- Botón de llamada.
- Detección del código `*#06#`.
- Modal que muestra IMEI e IMEI2 estilo iPhone.
- Instalación como app web en iPhone al usar **Añadir a pantalla de inicio**.
- Modo standalone para ocultar la barra del navegador al abrir desde inicio.

## Estructura
- `index.html`
- `manifest.json`
- `sw.js`
- `icons/`

## Cómo usar
1. Sube estos archivos a un repositorio en GitHub.
2. Activa **GitHub Pages** en la rama principal.
3. Abre el enlace en Safari desde iPhone.
4. Toca **Compartir > Añadir a pantalla de inicio**.
5. Ábrela desde el icono de inicio.

## Importante
En iPhone, para que no se vea la barra ni el enlace, la web app debe abrirse desde el icono añadido al inicio, no directamente desde Safari.

## Personalización
Si quieres cambiar los IMEI demo, edita estas líneas dentro de `index.html`:

```js
const demoIMEI1 = '356789123456789';
const demoIMEI2 = '356789123450123';
```
