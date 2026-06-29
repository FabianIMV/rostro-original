# Mira por ti mismo

Una experiencia guiada e interactiva de los **experimentos de apuntar** de
Douglas Harding (*The Headless Way*), en español. No es un sitio informativo ni
un blog: es un artefacto contemplativo que conduce al visitante, en unos tres
minutos, a mirar directamente su propia experiencia.

> No me creas nada de esto. Acabas de mirarlo tú.

Basado en los experimentos de Douglas Harding —
[headless.org](https://www.headless.org). De uso libre.

## Cómo funciona

Es un sitio **estático de una sola página**. No hay backend, ni build step
obligatorio, ni login, ni tracking.

- `index.html` — la experiencia completa (todas las escenas).
- `style.css` — estilos (mobile-first, paleta oscura profunda).
- `main.js` — animaciones, scroll suave y el fondo WebGL de "niebla luminosa".
- `og-image.png` — imagen para compartir en WhatsApp / redes.

Librerías vía CDN (GSAP + ScrollTrigger, Lenis) y tipografías de Google Fonts.
Si WebGL no está disponible o el visitante pide *movimiento reducido*, el sitio
degrada con elegancia a un gradiente CSS estático.

## Probar en local

No necesita compilación. Basta con servir la carpeta:

```bash
# Opción 1: Python
python3 -m http.server 8000

# Opción 2: Node
npx serve .
```

Luego abre `http://localhost:8000`.

## Publicar en GitHub Pages

1. Sube estos archivos a la **raíz** del repositorio (`index.html` en la raíz).
2. En GitHub: **Settings → Pages**.
3. En *Build and deployment → Source*, elige **Deploy from a branch**.
4. Selecciona la rama (`main`) y la carpeta `/ (root)`. Guarda.
5. Espera un minuto: el sitio quedará disponible en
   `https://<usuario>.github.io/<repo>/`.

> Si usas un dominio propio, ajusta las rutas de las metaetiquetas Open Graph
> (`og:image`) a URLs absolutas para que la vista previa al compartir funcione
> siempre.

## Accesibilidad

- Respeta `prefers-reduced-motion` (desactiva el scroll suave, los reveals y el
  fondo animado).
- Navegable con teclado (flechas, espacio, Inicio/Fin).
- Contraste alto sobre fondo oscuro.

## Regenerar la imagen de compartir (opcional)

`og-image.png` se incluye ya generada. Si quieres regenerarla, necesitas Node y
Playwright/Chromium:

```bash
node scripts/make-og.mjs
```
